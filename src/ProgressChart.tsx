import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { DailyEntry } from './types';
import { formatDate } from './domain';
import type { ChartType } from './types';

export function ProgressChart({
  entries,
  chartType,
  onSelect,
}: {
  entries: DailyEntry[];
  chartType: ChartType;
  onSelect: (entry: DailyEntry) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = 720;
    const height = 280;
    const margin = { top: 18, right: 18, bottom: 42, left: 42 };
    const x =
      chartType === 'bar'
        ? d3
            .scaleBand<string>()
            .domain(entries.map((entry) => entry.date))
            .range([margin.left, width - margin.right])
            .padding(0.25)
        : d3
            .scalePoint<string>()
            .domain(entries.map((entry) => entry.date))
            .range([margin.left, width - margin.right])
            .padding(0.3);
    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg
      .append('g')
      .attr('class', 'chart-grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .tickValues([0, 25, 50, 75, 100])
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat(() => ''),
      );
    svg
      .append('g')
      .attr('class', 'chart-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(
            entries
              .filter((_, i) => i % Math.max(1, Math.ceil(entries.length / 6)) === 0)
              .map((entry) => entry.date),
          )
          .tickFormat((value) => formatDate(String(value))),
      );
    svg
      .append('g')
      .attr('class', 'chart-axis')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((value) => `${value}`),
      );
    if (chartType === 'bar') {
      svg
        .append('g')
        .selectAll('rect')
        .data(entries)
        .join('rect')
        .attr('class', 'chart-bar')
        .attr('x', (entry) => x(entry.date) ?? 0)
        .attr('y', (entry) => y(entry.dietPower))
        .attr('width', x.bandwidth())
        .attr('height', (entry) => y(0) - y(entry.dietPower))
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', (entry) => `${formatDate(entry.date)}: ${entry.dietPower} diet power`)
        .on('click', (_, entry) => onSelect(entry));
    } else {
      const line = d3
        .line<DailyEntry>()
        .x((entry) => x(entry.date) ?? 0)
        .y((entry) => y(entry.dietPower))
        .curve(d3.curveMonotoneX);
      svg.append('path').datum(entries).attr('class', 'chart-line').attr('d', line);
      svg
        .append('g')
        .selectAll('circle')
        .data(entries)
        .join('circle')
        .attr('class', 'chart-point')
        .attr('cx', (entry) => x(entry.date) ?? 0)
        .attr('cy', (entry) => y(entry.dietPower))
        .attr('r', 5)
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', (entry) => `${formatDate(entry.date)}: ${entry.dietPower} diet power`)
        .on('click', (_, entry) => onSelect(entry));
    }
  }, [entries, chartType, onSelect]);
  return entries.length ? (
    <svg
      ref={ref}
      className="progress-chart"
      aria-label={`Diet power ${chartType} chart`}
      role="img"
    />
  ) : (
    <div className="chart-empty">Add your first day to start your progress chart.</div>
  );
}
