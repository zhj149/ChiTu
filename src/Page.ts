namespace chitu {

    export type PageData = { [key: string]: string }

    export interface PageDisplayConstructor {
        new(app: PageMaster): PageDisplayer
    }

    export interface PageDisplayer {
        show(targetPage: Page, currentPage: chitu.Page | null): Promise<any>;
        hide(targetPage: Page, currentPage: chitu.Page | null): Promise<any>;
    }

    export interface PageParams {
        app: PageMaster,
        action: Action,
        element: HTMLElement,
        displayer: PageDisplayer,
        name: string,
        data: PageData,
    }

    /**
     * 页面，用把 HTML Element 包装起来。
     */
    export class Page {

        private _element: HTMLElement;
        private _app: PageMaster;
        private _displayer: PageDisplayer;
        private _action: Action;
        private _name: string

        static tagName = 'div';

        data: PageData = {}

        /** 脚本执行完成后引发 */
        load = Callbacks<this, PageData>();

        /** 页面显示时引发 */
        showing = Callbacks<this, PageData>();

        /** 页面显示时完成后引发 */
        shown = Callbacks<this, PageData>();

        hiding = Callbacks<this, PageData>();
        hidden = Callbacks<this, PageData>();

        closing = Callbacks<this, PageData>();
        closed = Callbacks<this, PageData>();

        constructor(params: PageParams) {
            this._element = params.element;
            this._app = params.app;
            this._displayer = params.displayer;
            this._action = params.action;
            this.data = params.data
            this._name = params.name;

            // 确保异步调用
            setTimeout(() => {
                this.executePageAction();
            });
        }
        on_load() {
            return this.load.fire(this, this.data);
        }
        private on_showing() {
            return this.showing.fire(this, this.data);
        }
        private on_shown() {
            return this.shown.fire(this, this.data);
        }
        private on_hiding() {
            return this.hiding.fire(this, this.data);
        }
        private on_hidden() {
            return this.hidden.fire(this, this.data);
        }
        private on_closing() {
            return this.closing.fire(this, this.data);
        }
        private on_closed() {
            return this.closed.fire(this, this.data);
        }
        show(): Promise<any> {
            this.on_showing();
            let currentPage = this._app.currentPage;
            if (this == currentPage) {
                currentPage = null;
            }
            return this._displayer.show(this, currentPage).then(o => {
                this.on_shown();
            });
        }
        hide(currentPage: chitu.Page | null): Promise<any> {
            this.on_hiding();
            return this._displayer.hide(this, currentPage).then(o => {
                this.on_hidden();
            });
        }
        close(): Promise<any> {
            this.on_closing();
            this._element.remove();
            this.on_closed();
            return Promise.resolve();
        }

        /**
         * 创建服务
         * @param type 服务类型
         */
        createService<T extends Service>(type?: ServiceConstructor<T>): T {
            type = type || chitu.Service as any as ServiceConstructor<T>
            let service = new type();
            service.error.add((ender, error) => {
                this._app.error.fire(this._app, error, this)
            })
            return service;
        }

        /**
         * 元素，与页面相对应的元素
         */
        get element(): HTMLElement {
            return this._element;
        }

        /**
         * 名称
         */
        get name(): string {
            return this._name;
        }

        private async executePageAction() {
            let pageName: string = this.name;
            let action: Function;

            action = this._action;
            let actionExecuteResult;
            if (typeof action != 'function') {
                throw Errors.actionTypeError(pageName);
            }

            let actionResult = action(this) as Promise<any>;
            if (actionResult != null && actionResult.then != null) {
                actionResult.then(() => {
                    this.on_load();
                    // this.on_loadComplete();
                })
            }
            else {
                this.on_load();
            }
        }

        reload() {
            return this.executePageAction();
        }

        get app() {
            return this._app;
        }
    }
}


interface PageConstructor {
    new(args: chitu.PageParams): chitu.Page
}

class PageDisplayerImplement implements chitu.PageDisplayer {
    show(page: chitu.Page, previous: chitu.Page) {
        page.element.style.display = 'block';
        if (previous != null) {
            previous.element.style.display = 'none';
        }
        return Promise.resolve();
    }
    hide(page: chitu.Page, previous: chitu.Page) {
        page.element.style.display = 'none';
        if (previous != null) {
            previous.element.style.display = 'block';
        }
        return Promise.resolve();
    }
}