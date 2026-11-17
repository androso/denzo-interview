"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createList } from "@/features/lists/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LIST_NAME_MAX, listNameSchema } from "@/features/lists/models";

export function NewListForm({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  function startCreate() {
    setCreating(true);
  }

  function cancelCreate() {
    setName("");
    setCreating(false);
  }

  function submitCreate() {
    if (busyRef.current) return;

    const parsed = listNameSchema.safeParse(name);
    if (!parsed.success) {
      toast.error("Enter a list name.");
      return;
    }

    busyRef.current = true;
    startTransition(async () => {
      const result = await createList(parsed.data);
      busyRef.current = false;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setName("");
      setCreating(false);
      onNavigate?.();
      router.push(`/?list=${result.data.id}`);
    });
  }

  return (
    <>
      {creating ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitCreate();
          }}
        >
          <label className="sr-only" htmlFor={inputId}>
            New list name
          </label>
          <Input
            ref={inputRef}
            id={inputId}
            value={name}
            placeholder="List name"
            maxLength={LIST_NAME_MAX}
            disabled={pending}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => {
              if (!pending && name.trim() === "") cancelCreate();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                cancelCreate();
              }
            }}
          />
        </form>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="justify-start"
          onClick={startCreate}
        >
          + New list
        </Button>
      )}
    </>
  );
}
