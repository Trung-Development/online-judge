declare module "overtype" {
  export default class OverType {
    constructor(selector: string | HTMLElement, options?: unknown);
    getValue(): string;
    setValue?(v: string): void;
    destroy?(): void;
    showPlainTextarea?(v: boolean): void;
    showPreviewMode?(v: boolean): void;
    showStats?(v: boolean): void;
    // instance-level theme setter (optional)
    setTheme?(name: string, opts?: Record<string, string>): void;
    // static API available on the bundled global in demos
    static setTheme?(name: string, opts?: Record<string, string>): void;
    static currentTheme?: { name?: string };
  }
}
