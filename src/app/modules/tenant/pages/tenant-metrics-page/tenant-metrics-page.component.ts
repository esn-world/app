import { Component, OnInit } from '@angular/core';
import { interval, map, Observable, share, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import * as Highcharts from 'highcharts';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-tenant-metrics-page',
  templateUrl: './tenant-metrics-page.component.html',
  styleUrls: ['./tenant-metrics-page.component.scss'],
})
export class TenantMetricsPageComponent {
  Highcharts: typeof Highcharts = Highcharts;
  counters$: Observable<any[]>;
  gauges$: Observable<any[]>;
  histograms$: Observable<Highcharts.Options[]>;
  constructor(private http: HttpClient, private title: Title) {
    this.title.setTitle('Prisma Metrics - TUMi');
    const metrics$ = interval(5000).pipe(
      switchMap(() => this.http.get(`${environment.server}/metrics`)),
      share()
    );
    this.counters$ = metrics$.pipe(map((data: any) => data.counters));
    this.gauges$ = metrics$.pipe(map((data: any) => data.gauges));
    this.histograms$ = metrics$.pipe(
      map((data: any) =>
        data.histograms.map((histogram: any) => ({
          title: { text: histogram.key },
          caption: { text: histogram.description },
          chart: {
            type: 'column',
          },
          plotOptions: {
            column: {
              pointPadding: 0,
              borderWidth: 0,
              groupPadding: 0,
              shadow: false,
            },
          },
          xAxis: {
            type: 'logarithmic',
          },
          series: [
            {
              data: histogram.value.buckets,
            },
          ],
        }))
      )
    );
  }
}
