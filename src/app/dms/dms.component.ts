import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DmsNav } from './dms-nav';
import {
  DmsDoc,
  DocType,
  Integration,
  IntStatus,
  OWN,
  Owner,
  PALETTE,
  Provider,
  PROVIDERS,
  PULL_SAMPLES,
  SCOPES,
  seedDocuments,
  SEED_INTEGRATIONS,
  SEED_TYPES,
} from './dms.types';

interface FloatItem {
  value: string;
  label: string;
  color?: string;
  icon?: string;
  mono?: boolean;
  sub?: string;
}
interface FloatState {
  x: number;
  y: number;
  width: number;
  header?: string;
  current: string | null;
  items: FloatItem[];
  pick: (v: string) => void;
}

type Modal =
  | { kind: 'upload' }
  | { kind: 'pull' }
  | { kind: 'type'; editId: string | null }
  | { kind: 'deltype'; id: string }
  | { kind: 'connect'; provKey: string | null; editId: string | null };

interface PickedFile {
  name: string;
  ext: string;
  sizeLabel: string;
}

@Component({
  standalone: true,
  selector: 'app-dms',
  imports: [FormsModule],
  templateUrl: './dms.component.html',
  styleUrl: './dms.component.css',
})
export class DmsView {
  // ---- expose constants to template ----
  readonly PALETTE = PALETTE;
  readonly PROVIDERS = PROVIDERS;
  readonly SCOPES = SCOPES;
  readonly providerKeys = Object.keys(PROVIDERS);

  // ---- core state ----
  /** Active section is owned by the shell rail (DmsNav) so the left rail can drive it. */
  private readonly nav = inject(DmsNav);
  readonly view = this.nav.view;
  readonly search = signal('');
  readonly fSource = signal('all');
  readonly fType = signal('all');
  readonly fDate = signal('all');
  readonly selected = signal<Set<string>>(new Set());
  readonly drawerId = signal<string | null>(null);

  readonly types = signal<DocType[]>(SEED_TYPES.map((t) => ({ ...t, fields: [...t.fields] })));
  readonly integrations = signal<Integration[]>(SEED_INTEGRATIONS.map((i) => ({ ...i, config: { ...i.config } })));
  readonly documents = signal<DmsDoc[]>(seedDocuments());

  // ---- overlays ----
  readonly modal = signal<Modal | null>(null);
  readonly floatState = signal<FloatState | null>(null);
  readonly toastMsg = signal<string | null>(null);
  readonly toastIcon = signal('i-check');
  private toastT: ReturnType<typeof setTimeout> | null = null;

  // ---- modal form state ----
  readonly uploadPicked = signal<PickedFile[]>([]);
  readonly dragOver = signal(false);
  readonly pullChosen = signal<string | null>(null);
  readonly pullImporting = signal(false);
  // type modal
  readonly tfName = signal('');
  readonly tfColor = signal(PALETTE[3]);
  readonly tfDesc = signal('');
  readonly tfFields = signal<string[]>([]);
  readonly tfNewField = signal('');
  readonly tfNameErr = signal(false);
  // connect modal
  readonly cfLabel = signal('');
  readonly cfUrl = signal('');
  readonly cfClient = signal('');
  readonly cfSecret = signal('');
  readonly cfFolder = signal('');
  readonly cfScope = signal('incremental');
  readonly cfErrors = signal<Record<string, boolean>>({});
  readonly cfTestState = signal<'idle' | 'testing' | 'ok' | 'fillfirst'>('idle');

  // ============================================================
  //  lookups & helpers
  // ============================================================
  typeById(id: string | null): DocType | null {
    return this.types().find((t) => t.id === id) ?? null;
  }
  intById(id: string | null): Integration | null {
    return this.integrations().find((i) => i.id === id) ?? null;
  }
  docSourceLabel(d: DmsDoc): string {
    return d.sourceType === 'upload' ? 'Uploaded' : this.intById(d.intId)?.label || 'Integration';
  }
  typeUsage(tid: string): number {
    return this.documents().filter((d) => d.typeId === tid).length;
  }
  own(key: string): Owner {
    return OWN[key] || OWN['sys'];
  }
  provider(key: string): Provider {
    return PROVIDERS[key];
  }
  tagStyle(c: string): string {
    return `color:${c};background:color-mix(in oklab, ${c} 16%, transparent);border:1px solid color-mix(in oklab, ${c} 30%, transparent)`;
  }
  avatarStyle(key: string, sz = 24): string {
    const o = this.own(key);
    return `width:${sz}px;height:${sz}px;font-size:${Math.round(sz * 0.42)}px;background:${o.bg};color:${o.fg}`;
  }
  provTileStyle(key: string, sz = 34): string {
    const p = this.provider(key);
    return `width:${sz}px;height:${sz}px;font-size:${Math.round(sz * 0.34)}px;${this.tagStyle(p.hue)}`;
  }
  scopeLabel(v: string): string {
    return SCOPES.find((s) => s.value === v)?.label ?? '';
  }
  private uid(p: string): string {
    return p + '-' + Math.random().toString(36).slice(2, 7);
  }
  private bump() {
    this.documents.set([...this.documents()]);
  }

  // ============================================================
  //  computed
  // ============================================================
  readonly crumb = computed(() =>
    this.view() === 'documents' ? 'Documents' : this.view() === 'types' ? 'Document Types' : 'Configuration',
  );
  readonly hasIntError = computed(() => this.integrations().some((i) => i.status === 'error'));

  readonly filteredDocs = computed<DmsDoc[]>(() => {
    const q = this.search().trim().toLowerCase();
    const fSource = this.fSource();
    const fType = this.fType();
    const fDate = this.fDate();
    return this.documents().filter((d) => {
      if (q && !d.name.toLowerCase().includes(q)) return false;
      if (fSource !== 'all') {
        if (fSource === 'upload') {
          if (d.sourceType !== 'upload') return false;
        } else if (d.intId !== fSource) return false;
      }
      if (fType !== 'all') {
        if (fType === 'none') {
          if (d.typeId) return false;
        } else if (d.typeId !== fType) return false;
      }
      if (fDate !== 'all' && d.days > Number(fDate)) return false;
      return true;
    });
  });

  readonly fCount = computed(
    () => [this.fSource() !== 'all', this.fType() !== 'all', this.fDate() !== 'all'].filter(Boolean).length,
  );
  readonly filtersOn = computed(() => this.fCount() > 0 || this.search().trim().length > 0);

  readonly srcLabel = computed(() => {
    const v = this.fSource();
    return v === 'all' ? 'All sources' : v === 'upload' ? 'Uploaded' : this.intById(v)?.label || 'Source';
  });
  readonly typeLabel = computed(() => {
    const v = this.fType();
    return v === 'all' ? 'All types' : v === 'none' ? 'No type' : this.typeById(v)?.name || 'Type';
  });
  readonly dateLabel = computed(() => {
    const v = this.fDate();
    return v === 'all' ? 'Any time' : ({ '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days' } as Record<string, string>)[v];
  });

  readonly drawerDoc = computed<DmsDoc | null>(() => this.documents().find((d) => d.id === this.drawerId()) ?? null);

  readonly allVisibleSelected = computed(() => {
    const vis = this.filteredDocs();
    const sel = this.selected();
    return vis.length > 0 && vis.every((d) => sel.has(d.id));
  });
  readonly someVisibleSelected = computed(() => {
    const vis = this.filteredDocs();
    const sel = this.selected();
    const n = vis.filter((d) => sel.has(d.id)).length;
    return n > 0 && n < vis.length;
  });

  readonly connectedIntegrations = computed(() => this.integrations());
  readonly availProviderKeys = computed(() =>
    this.providerKeys.filter((k) => !this.integrations().some((i) => i.provider === k)),
  );
  readonly pullCandidates = computed(() => this.integrations().filter((i) => i.status !== 'disabled'));

  constructor() {
    // Switching section (driven by the rail) clears transient UI state.
    let prev = this.view();
    effect(() => {
      const v = this.view();
      if (v !== prev) {
        prev = v;
        this.selected.set(new Set());
        this.closeFloat();
        this.closeDrawer();
        this.closeModal();
      }
    });
  }

  // ============================================================
  //  selection
  // ============================================================
  isSelected(id: string): boolean {
    return this.selected().has(id);
  }
  toggleRow(id: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    const s = new Set(this.selected());
    checked ? s.add(id) : s.delete(id);
    this.selected.set(s);
  }
  toggleAll(ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    const s = new Set(this.selected());
    this.filteredDocs().forEach((d) => (checked ? s.add(d.id) : s.delete(d.id)));
    this.selected.set(s);
  }
  clearSel() {
    this.selected.set(new Set());
  }

  // ============================================================
  //  float menu
  // ============================================================
  openFloat(
    ev: Event,
    opts: { items: FloatItem[]; current: string | null; width: number; header?: string; pick: (v: string) => void },
    align: 'left' | 'right' = 'left',
  ) {
    ev.stopPropagation();
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    let left = align === 'right' ? r.right - opts.width : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - opts.width - 8));
    this.floatState.set({
      x: left,
      y: r.bottom + 6,
      width: opts.width,
      header: opts.header,
      current: opts.current,
      items: opts.items,
      pick: opts.pick,
    });
  }
  pickFloat(v: string) {
    const s = this.floatState();
    this.closeFloat();
    s?.pick(v);
  }
  closeFloat() {
    this.floatState.set(null);
  }

  private typeMenuItems(includeNone: boolean): FloatItem[] {
    const items: FloatItem[] = this.types().map((t) => ({
      value: t.id,
      label: t.name,
      color: t.color,
      mono: true,
      sub: String(this.typeUsage(t.id)),
    }));
    if (includeNone) items.unshift({ value: 'none', label: 'No type', icon: 'i-close' });
    return items;
  }

  // ---- filter menus ----
  openSourceFilter(ev: Event) {
    const items: FloatItem[] = [
      { value: 'all', label: 'All sources', icon: 'i-folder' },
      { value: 'upload', label: 'Uploaded', icon: 'i-upload' },
      ...this.integrations().map((i) => ({ value: i.id, label: i.label, icon: 'i-cloud' })),
    ];
    this.openFloat(ev, { items, current: this.fSource(), width: 220, pick: (v) => this.fSource.set(v) });
  }
  openTypeFilter(ev: Event) {
    const items: FloatItem[] = [
      { value: 'all', label: 'All types', icon: 'i-tag' },
      { value: 'none', label: 'No type', icon: 'i-close' },
      ...this.types().map((t) => ({ value: t.id, label: t.name, color: t.color, mono: true })),
    ];
    this.openFloat(ev, { items, current: this.fType(), width: 210, pick: (v) => this.fType.set(v) });
  }
  openDateFilter(ev: Event) {
    const items: FloatItem[] = [
      { value: 'all', label: 'Any time' },
      { value: '7', label: 'Last 7 days' },
      { value: '30', label: 'Last 30 days' },
      { value: '90', label: 'Last 90 days' },
    ];
    this.openFloat(ev, { items, current: this.fDate(), width: 190, pick: (v) => this.fDate.set(v) });
  }
  clearFilters() {
    this.fSource.set('all');
    this.fType.set('all');
    this.fDate.set('all');
    this.search.set('');
  }

  // ============================================================
  //  bulk actions
  // ============================================================
  bulkAssign(ev: Event) {
    this.openFloat(ev, {
      header: 'Assign type',
      current: null,
      width: 220,
      items: this.typeMenuItems(true),
      pick: (v) => {
        const tid = v === 'none' ? null : v;
        const ids = this.selected();
        this.documents().forEach((d) => {
          if (ids.has(d.id)) d.typeId = tid;
        });
        this.bump();
        const n = ids.size;
        this.toast(`${tid ? this.typeById(tid)!.name + ' assigned to' : 'Type cleared on'} ${n} document${n === 1 ? '' : 's'}`);
      },
    });
  }
  bulkDelete() {
    const ids = this.selected();
    const n = ids.size;
    this.documents.set(this.documents().filter((d) => !ids.has(d.id)));
    this.selected.set(new Set());
    this.toast(`${n} document${n === 1 ? '' : 's'} deleted`);
  }

  // ============================================================
  //  document drawer
  // ============================================================
  openDrawer(id: string) {
    this.drawerId.set(id);
  }
  closeDrawer() {
    this.drawerId.set(null);
  }
  setDrawerName(v: string) {
    const d = this.drawerDoc();
    if (!d) return;
    d.name = v;
    this.bump();
  }
  setDrawerMeta(field: string, v: string) {
    const d = this.drawerDoc();
    if (!d) return;
    d.meta[field] = v;
  }
  openDrawerTypeMenu(ev: Event) {
    const d = this.drawerDoc();
    this.openFloat(ev, {
      header: 'Set type',
      width: 220,
      current: d?.typeId ?? null,
      items: this.typeMenuItems(true),
      pick: (v) => {
        const doc = this.drawerDoc();
        if (!doc) return;
        doc.typeId = v === 'none' ? null : v;
        doc.meta = {};
        this.bump();
      },
    });
  }
  deleteDrawerDoc() {
    const id = this.drawerId();
    if (!id) return;
    this.documents.set(this.documents().filter((d) => d.id !== id));
    const s = new Set(this.selected());
    s.delete(id);
    this.selected.set(s);
    this.closeDrawer();
    this.toast('Document deleted');
  }

  // ============================================================
  //  modals — open/close
  // ============================================================
  get isModalOpen(): boolean {
    return this.modal() !== null;
  }
  get scrimOpen(): boolean {
    return this.drawerId() !== null || this.modal() !== null;
  }
  closeModal() {
    this.modal.set(null);
  }
  onScrimClick() {
    if (this.modal()) this.closeModal();
    else if (this.drawerId()) this.closeDrawer();
  }

  // ---- upload ----
  openUpload() {
    this.uploadPicked.set([]);
    this.dragOver.set(false);
    this.modal.set({ kind: 'upload' });
  }
  onFileInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files) this.addFiles(input.files);
    input.value = '';
  }
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.dragOver.set(false);
    if (ev.dataTransfer?.files?.length) this.addFiles(ev.dataTransfer.files);
  }
  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    this.dragOver.set(true);
  }
  onDragLeave(ev: DragEvent) {
    ev.preventDefault();
    this.dragOver.set(false);
  }
  private addFiles(list: FileList) {
    const next = [...this.uploadPicked()];
    [...list].forEach((f) =>
      next.push({
        name: f.name.replace(/\.[^.]+$/, ''),
        ext: (f.name.split('.').pop() || 'pdf').toLowerCase(),
        sizeLabel: this.fmtSize(f.size),
      }),
    );
    this.uploadPicked.set(next);
  }
  removePicked(i: number) {
    const next = [...this.uploadPicked()];
    next.splice(i, 1);
    this.uploadPicked.set(next);
  }
  private fmtSize(b: number): string {
    if (!b) return (Math.random() * 3 + 0.1).toFixed(1) + ' MB';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return Math.round(b / 1024) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  confirmUpload() {
    const picked = this.uploadPicked();
    const now = Date.now();
    const next = [...this.documents()];
    picked.forEach((f, i) =>
      next.unshift({
        id: 'doc-' + now + '-' + i,
        name: f.name,
        ext: f.ext,
        sourceType: 'upload',
        intId: null,
        typeId: null,
        days: 0,
        date: 'Today',
        size: f.sizeLabel,
        owner: 'mk',
        meta: {},
      }),
    );
    this.documents.set(next);
    const n = picked.length;
    this.closeModal();
    this.toast(`${n} file${n === 1 ? '' : 's'} uploaded`);
  }

  // ---- pull ----
  openPull(preselect?: string) {
    this.pullImporting.set(false);
    const conn = this.pullCandidates();
    this.pullChosen.set(preselect || conn.find((i) => i.status === 'connected')?.id || null);
    this.modal.set({ kind: 'pull' });
  }
  pullPick(id: string, status: IntStatus) {
    if (status === 'error') return;
    this.pullChosen.set(id);
  }
  pullGo() {
    const id = this.pullChosen();
    if (!id) return;
    this.pullImporting.set(true);
    setTimeout(() => {
      const it = this.intById(id);
      if (!it) return;
      const now = Date.now();
      const samples = (PULL_SAMPLES[it.provider] || PULL_SAMPLES['sharepoint']).map((r) => ({ name: r[0], ext: r[1], size: r[2] }));
      const next = [...this.documents()];
      samples.forEach((s, i) =>
        next.unshift({
          id: 'doc-' + now + '-' + i,
          name: s.name,
          ext: s.ext,
          sourceType: 'integration',
          intId: it.id,
          typeId: null,
          days: 0,
          date: 'Today',
          size: s.size,
          owner: 'sys',
          meta: {},
        }),
      );
      this.documents.set(next);
      it.lastSync = 'just now';
      this.integrations.set([...this.integrations()]);
      this.closeModal();
      this.toast(`${samples.length} documents pulled from ${it.label}`);
    }, 850);
  }

  // ---- type create/edit ----
  openType(editId: string | null) {
    const editing = editId ? this.typeById(editId) : null;
    this.tfName.set(editing ? editing.name : '');
    this.tfColor.set(editing ? editing.color : PALETTE[3]);
    this.tfDesc.set(editing ? editing.desc : '');
    this.tfFields.set(editing ? [...editing.fields] : []);
    this.tfNewField.set('');
    this.tfNameErr.set(false);
    this.modal.set({ kind: 'type', editId });
  }
  addField() {
    const v = this.tfNewField().trim();
    if (!v) return;
    this.tfFields.set([...this.tfFields(), v]);
    this.tfNewField.set('');
  }
  removeField(i: number) {
    const next = [...this.tfFields()];
    next.splice(i, 1);
    this.tfFields.set(next);
  }
  saveType() {
    const m = this.modal();
    if (!m || m.kind !== 'type') return;
    const name = this.tfName().trim().toUpperCase();
    if (!name) {
      this.tfNameErr.set(true);
      return;
    }
    const desc = this.tfDesc().trim();
    const color = this.tfColor();
    const fields = this.tfFields();
    if (m.editId) {
      const t = this.typeById(m.editId);
      if (t) Object.assign(t, { name, color, desc, fields: [...fields] });
      this.types.set([...this.types()]);
      this.toast('Type updated');
    } else {
      this.types.set([...this.types(), { id: this.uid('type'), name, color, desc, fields: [...fields] }]);
      this.toast('Type created');
    }
    this.closeModal();
  }

  // ---- type delete ----
  openDelType(id: string) {
    this.modal.set({ kind: 'deltype', id });
  }
  confirmDelType() {
    const m = this.modal();
    if (!m || m.kind !== 'deltype') return;
    const id = m.id;
    this.documents().forEach((d) => {
      if (d.typeId === id) d.typeId = null;
    });
    this.documents.set([...this.documents()]);
    this.types.set(this.types().filter((t) => t.id !== id));
    this.closeModal();
    this.toast('Type deleted');
  }

  // ---- integration connect/edit ----
  openConnect(provKey: string | null, editId: string | null) {
    const editing = editId ? this.intById(editId) : null;
    const c = editing ? editing.config : { url: '', client: '', secret: '', folder: '', scope: 'incremental' };
    this.cfLabel.set(editing ? editing.label : '');
    this.cfUrl.set(c.url);
    this.cfClient.set(c.client);
    this.cfSecret.set(c.secret);
    this.cfFolder.set(c.folder);
    this.cfScope.set(c.scope || 'incremental');
    this.cfErrors.set({});
    this.cfTestState.set('idle');
    this.modal.set({ kind: 'connect', provKey, editId });
  }
  connectProviderKey(): string {
    const m = this.modal();
    if (!m || m.kind !== 'connect') return 'sharepoint';
    return m.editId ? this.intById(m.editId)!.provider : m.provKey!;
  }
  openScopeMenu(ev: Event) {
    this.openFloat(ev, {
      width: 280,
      current: this.cfScope(),
      items: SCOPES.map((s) => ({ value: s.value, label: s.label })),
      pick: (v) => this.cfScope.set(v),
    });
  }
  private validateConnect(): boolean {
    const errs: Record<string, boolean> = {
      label: !this.cfLabel().trim(),
      url: !this.cfUrl().trim(),
      client: !this.cfClient().trim(),
      secret: !this.cfSecret().trim(),
    };
    this.cfErrors.set(errs);
    return !Object.values(errs).some(Boolean);
  }
  testConnect() {
    if (!this.validateConnect()) {
      this.cfTestState.set('fillfirst');
      return;
    }
    this.cfTestState.set('testing');
    setTimeout(() => this.cfTestState.set('ok'), 1000);
  }
  saveConnect() {
    const m = this.modal();
    if (!m || m.kind !== 'connect') return;
    if (!this.validateConnect()) return;
    const key = this.connectProviderKey();
    const config = {
      url: this.cfUrl().trim(),
      client: this.cfClient().trim(),
      secret: this.cfSecret().trim(),
      folder: this.cfFolder().trim(),
      scope: this.cfScope(),
    };
    if (m.editId) {
      const it = this.intById(m.editId)!;
      it.label = this.cfLabel().trim();
      it.config = config;
      it.status = 'connected';
      it.lastSync = 'just now';
      delete it.error;
      this.integrations.set([...this.integrations()]);
      this.toast('Integration updated');
    } else {
      this.integrations.set([
        ...this.integrations(),
        { id: this.uid('int'), provider: key, label: this.cfLabel().trim(), status: 'connected', lastSync: 'just now', config },
      ]);
      this.toast(`${this.provider(key).name} connected`);
    }
    this.closeModal();
  }

  // ============================================================
  //  configuration actions
  // ============================================================
  syncNow(id: string) {
    const it = this.intById(id);
    if (!it) return;
    if (it.status === 'error') {
      this.openConnect(null, id);
      return;
    }
    it.status = 'syncing';
    this.integrations.set([...this.integrations()]);
    setTimeout(() => {
      it.status = 'connected';
      it.lastSync = 'just now';
      this.integrations.set([...this.integrations()]);
      this.toast(`${it.label} synced`);
    }, 1100);
  }
  intMenu(ev: Event, id: string) {
    const it = this.intById(id);
    if (!it) return;
    this.openFloat(
      ev,
      {
        width: 180,
        current: null,
        items: [
          { value: 'edit', label: 'Edit', icon: 'i-edit' },
          { value: 'toggle', label: it.status === 'disabled' ? 'Enable' : 'Disable', icon: 'i-power' },
          { value: 'remove', label: 'Remove', icon: 'i-trash' },
        ],
        pick: (v) => {
          if (v === 'edit') this.openConnect(null, id);
          else if (v === 'toggle') {
            it.status = it.status === 'disabled' ? 'connected' : 'disabled';
            this.integrations.set([...this.integrations()]);
            this.toast(it.status === 'disabled' ? 'Integration disabled' : 'Integration enabled');
          } else if (v === 'remove') {
            this.integrations.set(this.integrations().filter((x) => x.id !== id));
            this.toast('Integration removed');
          }
        },
      },
      'right',
    );
  }

  // ============================================================
  //  toast
  // ============================================================
  toast(msg: string, icon = 'i-check') {
    this.toastMsg.set(msg);
    this.toastIcon.set(icon);
    if (this.toastT) clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.toastMsg.set(null), 2300);
  }

  // ============================================================
  //  global listeners
  // ============================================================
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.floatState()) this.closeFloat();
    else if (this.modal()) this.closeModal();
    else if (this.drawerId()) this.closeDrawer();
  }
  @HostListener('window:resize')
  onResize() {
    this.closeFloat();
  }
}
