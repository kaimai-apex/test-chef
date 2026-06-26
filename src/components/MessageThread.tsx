"use client";

import { useRef } from "react";
import { Avatar } from "./Photo";
import { sendMessage } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import type { Message } from "@/lib/types";

export function MessageThread({
  bookingId,
  messages,
  currentUserId,
  names,
  seeds,
}: {
  bookingId: string;
  messages: Message[];
  currentUserId: string;
  names: Record<string, string>;
  seeds: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await sendMessage(bookingId, formData);
    formRef.current?.reset();
  }

  return (
    <div className="card flex flex-col">
      <div className="border-b border-line px-5 py-3 font-bold">Messages</div>
      <div className="flex max-h-96 flex-col gap-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted">
            No messages yet. Say hello and finalize the details.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
              <Avatar seed={seeds[m.senderId] ?? m.senderId} name={names[m.senderId] ?? "?"} size={32} />
              <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                <div
                  className={`inline-block rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-terracotta text-white" : "bg-sand text-ink"
                  }`}
                >
                  {m.body}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {names[m.senderId]?.split(" ")[0]} · {timeAgo(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form ref={formRef} action={action} className="flex gap-2 border-t border-line p-3">
        <input name="body" placeholder="Type a message…" className="input" autoComplete="off" />
        <button type="submit" className="btn-primary">Send</button>
      </form>
    </div>
  );
}
