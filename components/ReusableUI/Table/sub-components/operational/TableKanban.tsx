"use client"
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    DragOverlay,
    type DragStartEvent,
    useSensor,
    useSensors,
    KeyboardSensor,
    Announcements,
    UniqueIdentifier,
    TouchSensor,
    MouseSensor,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import type { Column } from "./kanban/BoardColumn";
import { hasDraggableData } from "./kanban/utils";
import { coordinateGetter } from "./kanban/multipleContainersKeyboardPreset";
import { Task, TaskCard } from "./kanban/TaskCard";
import { BoardContainer } from "./kanban/BoardColumn";
import { BoardColumn } from "./kanban/BoardColumn";
import { Button } from "@/components/ui/button";
import { Loader2, Table } from "lucide-react";
import { GetKanbanData, UpdateKanbanData } from "../../utils/utils";


interface Kanban {
    config: any;
    endpoint: string;
    onToogle: () => void;
}

const defaultCols = [
    {
        id: "active" as const,
        title: "Active",
    },
    {
        id: "inactive" as const,
        title: "InActive",
    },
    {
        id: "suspended" as const,
        title: "Suspended",
    },
] satisfies Column[];

export type ColumnId = (typeof defaultCols)[number]["id"];


export default function KanbanBoard({ config, onToogle, endpoint }: Kanban) {
    const pickedUpTaskColumn = useRef<ColumnId | null>(null);
    const [loading, setLoading] = useState(true)
    const [tasks, setTasks] = useState<Task[]>([]);

    const [activeColumn, setActiveColumn] = useState<Column | null>(null);

    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [columns, setColumns] = useState<Column[]>(config.columnOptions);
    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: coordinateGetter,
        })
    );


    const UpdateData = async (data: any) => {
        if (!data) {
            return;
        }
        try {
            const response = await UpdateKanbanData(data, endpoint, config)
            if (response.status != 200) {
                throw new Error("Error Fetching Kanban Data!");
            }
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        const FetchData = async () => {
            setLoading(true);
            try {
                const response = await GetKanbanData(config, endpoint)
                if (response.status != 200) {
                    throw new Error("Error Fetching Kanban Data!");
                }

                setTasks(response.data.tasks);
                setColumns(response.data.columns);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }

        }
        FetchData();
    }, [])



    function getDraggingTaskData(taskId: UniqueIdentifier, columnId: ColumnId) {
        const tasksInColumn = tasks.filter((task) => task.columnId === columnId);
        const taskPosition = tasksInColumn.findIndex((task) => task.id === taskId);
        const column = columns.find((col) => col.id === columnId);
        return {
            tasksInColumn,
            taskPosition,
            column,
        };
    }

    const announcements: Announcements = {
        onDragStart({ active }) {
            if (!hasDraggableData(active)) return;
            if (active.data.current?.type === "Column") {
                const startColumnIdx = columnsId.findIndex((id) => id === active.id);
                const startColumn = columns[startColumnIdx];
                return `Picked up Column ${startColumn?.title} at position: ${startColumnIdx + 1
                    } of ${columnsId.length}`;
            } else if (active.data.current?.type === "Task") {
                pickedUpTaskColumn.current = active.data.current.task.columnId;
                const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
                    active.id,
                    pickedUpTaskColumn.current
                );
                return `Picked up Task ${active.data.current.task.content
                    } at position: ${taskPosition + 1} of ${tasksInColumn.length
                    } in column ${column?.title}`;
            }
        },
        onDragOver({ active, over }) {
            if (!hasDraggableData(active) || !hasDraggableData(over)) return;

            if (
                active.data.current?.type === "Column" &&
                over.data.current?.type === "Column"
            ) {
                const overColumnIdx = columnsId.findIndex((id) => id === over.id);
                return `Column ${active.data.current.column.title} was moved over ${over.data.current.column.title
                    } at position ${overColumnIdx + 1} of ${columnsId.length}`;
            } else if (
                active.data.current?.type === "Task" &&
                over.data.current?.type === "Task"
            ) {
                const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
                    over.id,
                    over.data.current.task.columnId
                );
                if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
                    return `Task ${active.data.current.task.content
                        } was moved over column ${column?.title} in position ${taskPosition + 1
                        } of ${tasksInColumn.length}`;
                }
                return `Task was moved over position ${taskPosition + 1} of ${tasksInColumn.length
                    } in column ${column?.title}`;
            }
        },
        onDragEnd({ active, over }) {
            if (!hasDraggableData(active) || !hasDraggableData(over)) {
                pickedUpTaskColumn.current = null;
                return;
            }
            if (
                active.data.current?.type === "Column" &&
                over.data.current?.type === "Column"
            ) {
                const overColumnPosition = columnsId.findIndex((id) => id === over.id);

                return `Column ${active.data.current.column.title
                    } was dropped into position ${overColumnPosition + 1} of ${columnsId.length
                    }`;
            } else if (
                active.data.current?.type === "Task" &&
                over.data.current?.type === "Task"
            ) {
                const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
                    over.id,
                    over.data.current.task.columnId
                );
                if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
                    return `Task was dropped into column ${column?.title} in position ${taskPosition + 1
                        } of ${tasksInColumn.length}`;
                }
                return `Task was dropped into position ${taskPosition + 1} of ${tasksInColumn.length
                    } in column ${column?.title}`;
            }
            pickedUpTaskColumn.current = null;
        },
        onDragCancel({ active }) {
            pickedUpTaskColumn.current = null;
            if (!hasDraggableData(active)) return;
            return `Dragging ${active.data.current?.type} cancelled.`;
        },
    };

    if (loading) {
        return (
            <Loader2 className="mt-10 animate-spin" />
        )
    }

    return (
        <div className="mt-10">
            <div className="text-4xl font-semibold pb-4">
                <div className="flex my-2">
                    Kanban View
                    <Button variant={"outline"} className="text-center items-center justify-center align-center mx-4" onClick={() => { onToogle() }}><Table /> Toogle Table View</Button>
                </div>
            </div>

            <DndContext
                accessibility={{
                    announcements,
                }}
                sensors={sensors}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
            >
                <BoardContainer>
                    <SortableContext items={columnsId}>
                        {columns.map((col) => (
                            <BoardColumn
                                key={col.id}
                                column={col}
                                tasks={tasks.filter((task) => task.columnId === col.id)}
                            />
                        ))}
                    </SortableContext>
                </BoardContainer>

                {"document" in window &&
                    createPortal(
                        <DragOverlay>
                            {activeColumn && (
                                <BoardColumn
                                    isOverlay
                                    column={activeColumn}
                                    tasks={tasks.filter(
                                        (task) => task.columnId === activeColumn.id
                                    )}
                                />
                            )}
                            {activeTask && <TaskCard task={activeTask} isOverlay />}
                        </DragOverlay>,
                        document.body
                    )}
            </DndContext>
        </div>
    );

    function onDragStart(event: DragStartEvent) {
        if (!hasDraggableData(event.active)) return;
        const data = event.active.data.current;
        if (data?.type === "Column") {
            setActiveColumn(data.column);
            return;
        }

        if (data?.type === "Task") {
            setActiveTask(data.task);
            return;
        }
    }

    function onDragEnd(event: DragEndEvent) {
        const overData = event.over?.data.current?.task;
        if (overData) {
            UpdateData(overData);
        }
        setActiveColumn(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (!hasDraggableData(active)) return;

        const activeData = active.data.current;

        if (activeId === overId) return;

        const isActiveAColumn = activeData?.type === "Column";
        if (!isActiveAColumn) return;

        setColumns((columns) => {
            const activeColumnIndex = columns.findIndex((col) => col.id === activeId);

            const overColumnIndex = columns.findIndex((col) => col.id === overId);

            return arrayMove(columns, activeColumnIndex, overColumnIndex);
        });
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        if (!hasDraggableData(active) || !hasDraggableData(over)) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        const isActiveATask = activeData?.type === "Task";
        const isOverATask = overData?.type === "Task";

        if (!isActiveATask) return;

        // Im dropping a Task over anOther Task
        if (isActiveATask && isOverATask) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                const overIndex = tasks.findIndex((t) => t.id === overId);
                const activeTask = tasks[activeIndex];
                const overTask = tasks[overIndex];
                if (
                    activeTask &&
                    overTask &&
                    activeTask.columnId !== overTask.columnId
                ) {
                    activeTask.columnId = overTask.columnId;
                    return arrayMove(tasks, activeIndex, overIndex - 1);
                }

                return arrayMove(tasks, activeIndex, overIndex);
            });
        }

        const isOverAColumn = overData?.type === "Column";

        // Im dropping a Task over a column
        if (isActiveATask && isOverAColumn) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                const activeTask = tasks[activeIndex];
                if (activeTask) {
                    activeTask.columnId = overId as ColumnId;
                    return arrayMove(tasks, activeIndex, activeIndex);
                }
                return tasks;
            });
        }
    }
}