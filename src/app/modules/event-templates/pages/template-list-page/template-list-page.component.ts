import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EventFormDialogComponent } from '@tumi/legacy-app/modules/event-templates/components/event-form-dialog/event-form-dialog.component';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concat, firstValueFrom, map, Observable, of } from 'rxjs';
import {
  CreateEventTemplateGQL,
  GetLonelyEventTemplatesGQL,
  GetLonelyEventTemplatesQuery,
  GetTemplateCategoriesWithTemplatesGQL,
  GetTemplateCategoriesWithTemplatesQuery,
  Role,
} from '@tumi/legacy-app/generated/generated';
import { FormControl } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-template-list-page',
  templateUrl: './template-list-page.component.html',
  styleUrls: ['./template-list-page.component.scss'],
})
export class TemplateListPageComponent {
  public Role = Role;
  public templateCategories$: Observable<
    GetTemplateCategoriesWithTemplatesQuery['eventTemplateCategories']
  >;
  public eventTemplates$: Observable<
    GetLonelyEventTemplatesQuery['eventTemplates']
  >;
  @ViewChild('searchbar')
  private searchBar!: ElementRef;
  public searchEnabled = false;
  public searchControl = new FormControl('');
  private eventTemplateQuery;

  constructor(
    private title: Title,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private createTemplateMutation: CreateEventTemplateGQL,
    private loadTemplates: GetLonelyEventTemplatesGQL,
    private getEventTemplatesGQL: GetTemplateCategoriesWithTemplatesGQL,
    private router: Router
  ) {
    this.title.setTitle('Event Templates - TUMi');
    this.eventTemplateQuery = this.loadTemplates.watch(
      {},
      { fetchPolicy: 'cache-and-network' }
    );
    this.eventTemplates$ = combineLatest([
      concat(of(''), this.searchControl.valueChanges),
      this.eventTemplateQuery.valueChanges.pipe(
        map(({ data }) => data.eventTemplates)
      ),
    ]).pipe(
      map(([search, templates]) =>
        templates.filter((template) =>
          template.title.toLowerCase().includes((search ?? '').toLowerCase())
        )
      )
    );
    this.templateCategories$ = combineLatest([
      concat(of(''), this.searchControl.valueChanges),
      this.getEventTemplatesGQL
        .watch()
        .valueChanges.pipe(map(({ data }) => data.eventTemplateCategories)),
    ]).pipe(
      map(([search, categories]) =>
        categories.map((category) => ({
          ...category,
          templates: category.templates.filter(
            (template) =>
              template.title
                .toLowerCase()
                .includes((search ?? '').toLowerCase()) || !search
          ),
          templateCount: category.templates.filter(
            (template) =>
              template.title
                .toLowerCase()
                .includes((search ?? '').toLowerCase()) || !search
          ).length,
        }))
      )
    );
  }

  async createTemplate() {
    const categories = await firstValueFrom(this.templateCategories$);
    const template = await firstValueFrom(
      this.dialog
        .open(EventFormDialogComponent, {
          data: { categories },
          width: '600px',
          maxWidth: '100vw',
          panelClass: 'modern',
        })
        .afterClosed()
    );
    if (template) {
      this.snackBar.open('Saving template', undefined, { duration: 0 });
      const response = await firstValueFrom(
        this.createTemplateMutation.mutate({ input: template })
      );
      await this.eventTemplateQuery.refetch();
      this.snackBar.open('Template saved successfully');
      this.router.navigate([
        '/event-templates',
        response?.data?.createEventTemplate.id,
      ]);
    }
  }

  initSearch(): void {
    if (this.searchEnabled) {
      this.searchEnabled = false;
      this.searchControl.setValue('');
    } else {
      this.searchEnabled = true;
      setTimeout(() => {
        this.searchBar.nativeElement.focus();
      });
    }
  }
}
