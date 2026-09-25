"use client";
import { useEffect, useId, useRef } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import { UPLOAD_ACCEPT } from "@/lib/admin/labels";
import { uploadProductImage } from "@/lib/admin/actions/upload";
import { useUpload } from "./use-upload";
import { Thumb } from "./ui";
import { cn } from "@/lib/cn";

const positionLabel = (i: number) => (i === 0 ? "спереди" : i === 1 ? "сзади" : null);

function SortableTile({ url, index, onRemove }: { url: string; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const label = positionLabel(index);
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
        transition,
      }}
      className={cn("relative rounded border border-line bg-white", isDragging && "z-10 border-ink opacity-80")}
    >
      <Thumb src={url} alt={`Фото ${index + 1}`} className="aspect-[4/5] w-full rounded-t" />
      <div className="flex items-center justify-between gap-1 px-1 py-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Перетащить фото ${index + 1}`}
          className="grid size-11 cursor-grab touch-none place-items-center rounded text-muted transition-colors duration-150 hover:bg-paper-2 hover:text-ink active:cursor-grabbing"
        >
          <GripVertical className="size-4.5" aria-hidden />
        </button>
        <span className="min-w-0 truncate text-micro text-muted">
          {index + 1}
          {label && ` · ${label}`}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Удалить фото ${index + 1}`}
          className="grid size-11 place-items-center rounded text-muted transition-colors duration-150 hover:bg-paper-2 hover:text-ink"
        >
          <X className="size-4.5" aria-hidden />
        </button>
      </div>
    </li>
  );
}

/** Photos of one colour: multi-upload, drag to reorder (mouse, touch, keyboard), remove. */
export function ProductImages({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const { upload, pending } = useUpload(uploadProductImage);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = value.indexOf(String(active.id));
    const to = value.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChange(arrayMove(value, from, to));
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls = await upload(files);
    if (inputRef.current) inputRef.current.value = "";
    if (urls.length) onChange([...latest.current, ...urls.filter((u) => !latest.current.includes(u))]);
  };

  return (
    <div>
      <DndContext
        id={`dnd-${inputId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          screenReaderInstructions: {
            draggable: "Нажмите пробел, чтобы взять фото, стрелками переместите, пробел — отпустить, Esc — отмена.",
          },
        }}
      >
        <SortableContext items={value} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {value.map((url, i) => (
              <SortableTile key={url} url={url} index={i} onRemove={() => onChange(value.filter((u) => u !== url))} />
            ))}
            {Array.from({ length: pending }, (_, i) => (
              <li
                key={`pending-${i}`}
                aria-live="polite"
                className="grid aspect-[4/5] place-items-center rounded border border-dashed border-line bg-paper text-muted"
              >
                <Loader2 className="size-5 animate-spin" aria-hidden />
                <span className="sr-only">Загрузка…</span>
              </li>
            ))}
            <li>
              <label
                htmlFor={inputId}
                className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-muted bg-white p-2 text-center text-body-sm text-muted transition-colors duration-150 hover:border-ink hover:text-ink focus-within:outline-2 focus-within:outline-navy"
              >
                <ImagePlus className="size-6" aria-hidden />
                Добавить фото
                <input
                  ref={inputRef}
                  id={inputId}
                  type="file"
                  accept={UPLOAD_ACCEPT}
                  multiple
                  className="sr-only"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </label>
            </li>
          </ul>
        </SortableContext>
      </DndContext>
      <p className="mt-2 text-body-sm text-muted">
        1-е фото — спереди, 2-е — сзади. Перетащите, чтобы поменять порядок. JPG, PNG, WebP или AVIF до 10 МБ.
      </p>
    </div>
  );
}
