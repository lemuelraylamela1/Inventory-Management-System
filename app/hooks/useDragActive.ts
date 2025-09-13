// hooks/useDragActive.ts
import { useState } from "react";

export function useDragActive() {
  const [dragActive, setDragActive] = useState(false);

  const bind = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
    },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      return e.dataTransfer.files;
    },
  };

  return { dragActive, bind };
}
