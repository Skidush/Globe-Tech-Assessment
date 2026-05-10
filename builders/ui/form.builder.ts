import { Page, Locator } from "@playwright/test";
import { PlaywrightElementRole } from "../../types/roles.type";

export class FormBuilder {
    readonly page: Page;
    readonly formParentSelector: string;
    readonly iframeSelector: string | null;
    readonly fields: { name: string; selector: string }[] = [];
    readonly buttons: { name: string; text: string, selector: string | null }[] = [];
    readonly links: { name: string; href: string }[] = [];
    readonly checkboxes: { name: string; label: string }[] = [];

    constructor(page: Page, formParentSelector: string, iframeSelector: string | null = null) {
        this.page = page;
        this.formParentSelector = formParentSelector;
        this.iframeSelector = iframeSelector;
    }

    addField(name: string, selector: string): this {
        this.fields.push({ name, selector });
        return this;
    }

    addFields(fields: { name: string; selector: string }[]): this {
        this.fields.push(...fields);
        return this;
    }

    addButton(name: string, text: string, selector: string | null = null): this {
        this.buttons.push({ name, text, selector });
        return this;
    }

    addButtons(buttons: { name: string; text: string, selector: string | null }[]): this {
        this.buttons.push(...buttons);
        return this;
    }

    addLink(name: string, href: string): this {
        this.links.push({ name, href });
        return this;
    }

    addLinks(links: { name: string; href: string }[]): this {
        this.links.push(...links);
        return this;
    }

    addCheckbox(name: string, label: string): this {
        this.checkboxes.push({ name, label });
        return this;
    }

    addCheckboxes(checkboxes: { name: string; label: string }[]): this {
        this.checkboxes.push(...checkboxes);
        return this;
    }


    build(): Record<string, Locator> {
        let baseLocator;

        const form: Record<string, Locator> = {};
        const formLocator = this.page.locator(this.formParentSelector);

        baseLocator = this.iframeSelector != null ? formLocator.frameLocator(this.iframeSelector) : formLocator;

        for (const field of this.fields) {
            form[field.name] = baseLocator.locator(field.selector);
        }

        for (const button of this.buttons) {
            form[button.name] = button.selector ? baseLocator.locator(button.selector) : baseLocator.getByRole('button', { name: button.text });
        }

        for (const link of this.links) {
            form[link.name] = baseLocator.locator(`a[href="${link.href}"]`);
        }

        return form;
    }
}