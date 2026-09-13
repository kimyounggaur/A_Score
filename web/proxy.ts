import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isInstrumentId } from "@/lib/catalog/taxonomy";

export function proxy(request: NextRequest) {
  const rawSegment = request.nextUrl.pathname.split("/")[2];
  let instrument = "";

  try {
    instrument = decodeURIComponent(rawSegment ?? "");
  } catch {
    // Malformed route segments are invalid taxonomy values.
  }

  if (!isInstrumentId(instrument)) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/instruments/:instrument",
};
