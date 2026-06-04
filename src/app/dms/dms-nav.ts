import { Injectable, signal } from '@angular/core';
import { View } from './dms.types';

/**
 * Shared between the app shell's left rail (which drives the section) and the
 * DMS content component (which renders it). Lives at root so the selected
 * section survives while navigating around within the Documents workspace.
 */
@Injectable({ providedIn: 'root' })
export class DmsNav {
  readonly view = signal<View>('documents');
  setView(v: View) {
    this.view.set(v);
  }
}
