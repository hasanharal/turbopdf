import { useEffect, useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";
import { usePdfThumbs, ThumbsLoader } from "@/components/PdfThumbs";
import { Dropzone } from "@/components/Dropzone";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

const tool = getTool("reorder-pages");

const SortableThumb = ({ id, src, index }: { id: string; src: string; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? "border-primary shadow-elegant z-10" : "border-border hover:border-primary/60"
      }`}
    >
      <img src={src} alt={`Page ${index + 1}`} className="w-full" />
      <div className="absolute top-1 right-1 bg-background/80 rounded p-1"><GripVertical className="h-3 w-3" /></div>
      <div className="absolute bottom-0 inset-x-0 text-[10px] py-1 text-center bg-background/80 font-medium">{index + 1}</div>
    </div>
  );
};

export default function ReorderPages() {
  const [files, setFiles] = useState<File[]>([]);
  const file = files[0];
  const { thumbs, loading } = usePdfThumbs(file);
  const [order, setOrder] = useState<number[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { setOrder(thumbs.map((_, i) => i)); }, [thumbs]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((prev) => arrayMove(prev, prev.indexOf(+active.id), prev.indexOf(+over.id)));
  };

  const process = async () => {
    if (!file) throw new Error("Please upload a PDF.");
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const src = await PDFDocument.load(bytes);
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, order);
    pages.forEach((p) => out.addPage(p));
    const data = await out.save();
    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-reordered.pdf");
  };

  const customBody = (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
      {file && loading && <ThumbsLoader />}
      {file && !loading && order.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Drag pages to rearrange.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {order.map((i, displayIdx) => (
                  <SortableThumb key={i} id={String(i)} src={thumbs[i]} index={displayIdx} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Save Reordered PDF" />;
}
