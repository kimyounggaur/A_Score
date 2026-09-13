"use client";

import { type FormEvent, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ListSearchFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  query: string;
  onCommit: (query: string) => void;
};

/**
 * The parent keys this field by the validated URL query. That preserves fluid local typing while
 * a browser back/forward navigation remounts it with the restored URL value.
 */
export function ListSearchField({ id, label, placeholder, query, onCommit }: ListSearchFieldProps) {
  const [value, setValue] = useState(query);

  const commit = () => {
    const normalized = value.trim();
    if (normalized !== query) onCommit(normalized);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit();
  };

  return (
    <form role="search" onSubmit={submit}>
      <Label className="sr-only" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        name="q"
        type="search"
        placeholder={placeholder}
        value={value}
        onBlur={commit}
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  );
}
