import { Injectable } from "@nestjs/common";
import { Observable, Subject, merge, timer } from "rxjs";
import { filter, map } from "rxjs/operators";
import { MessageEvent } from "@nestjs/common";

interface PharmacyEvent {
  pharmacyId: string;
  type: string;
  payload: unknown;
}

@Injectable()
export class NotificationsService {
  private readonly bus$ = new Subject<PharmacyEvent>();

  emit(pharmacyId: string, type: string, payload: unknown) {
    this.bus$.next({ pharmacyId, type, payload });
  }

  /** Returns an SSE-compatible Observable scoped to one pharmacy.
   *  Merges real events with a 25s heartbeat so proxies don't drop the connection. */
  getStream(pharmacyId: string): Observable<MessageEvent> {
    const events$ = this.bus$.pipe(
      filter(e => e.pharmacyId === pharmacyId),
      map(e => ({ data: JSON.stringify({ type: e.type, payload: e.payload }) } as MessageEvent)),
    );

    const heartbeat$ = timer(0, 25_000).pipe(
      map(() => ({ data: JSON.stringify({ type: "ping" }) } as MessageEvent)),
    );

    return merge(heartbeat$, events$);
  }
}
