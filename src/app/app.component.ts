import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import europe from '../data/europe.json';
import pointsData from '../data/data-points.json';
import timelineData from '../data/data-timeline.json';

interface points {
    "name": string,
    "lat": number,
    "lon": number,
    "risk": string,
    "pending": number,
    "received": number,
    "overdue": number,
    "approved": number,
    "rejected": number
}

interface risk {
     "name": string,
     "risk": string
}

interface company {
     "company": string,
     "color": string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit  {
  title = 'geoChart';

  public pointer: points={
    "name": "",
    "lat": 0,
    "lon": 0,
    "risk": "red",
    "pending": 0,
    "received": 0,
    "overdue": 0,
    "approved": 0,
    "rejected": 0
  }

  public riskJudgement: [risk]=[{
    "name": "",
    "risk": ""
  }]

  public company: [company]=[{
    "company": "",
    "color": ""
  }];

  public calculateStyles(color:string) {
    return {background: color}
  }

  public changeSubmissionDetails(point:risk) {
    this.pointer = <points>pointsData.filter((points) => points.name === point.name)[0]
  }

  public ngOnInit(): void {
    let temp =  timelineData.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.company === value.company && t.color === value.color
    ))
    )
    this.company = <[company]>temp.map((data)=>{return {company: data.company, color: data.color}});


    //geoChart
    this.pointer=pointsData[0];
    this.riskJudgement = <[risk]>pointsData.map((points)=>{
      return {name: points.name, risk: points.risk}
    })

    const width = 600;
    const height = 600;
    const heightTimeLineChart = 300;

    const projection = d3.geoMercator().center([ 20, 57 ])
    .translate([ width/2, height/2 ])
    .scale(400);
    const path = d3.geoPath()
      .projection(projection);
    const svg = d3.select('#geoMap').append('svg')
      .attr('width', width)
      .attr('height', height);
    const europeBackground= svg.append("path")
    .attr('fill','#ddd')
    .attr('stroke','#fff')
    .attr('stroke-linejoin','round')
    .attr('stroke-linecap','round')
    //@ts-ignore
    .attr('d', path(topojson.feature(europe, europe.objects.collection)));
    const points = svg.selectAll('g')
    .attr('text-anchor','middle')
    .attr('font-family','sans-serif')
    .attr('font-size',14)
    .data(pointsData)
    .join('g')
    const pointsChild = points.append('g')
    .attr(
      'transform',
      ({ lat, lon }) =>
      //@ts-ignore
        `translate(${projection([lat, lon]).join(",")})`
    )
    .attr('fill',d=>d.risk)
    .text(d=>d.name);

    pointsChild.append('circle')
    .attr('r', 8)
    .on("click", (event) => {
      this.pointer=event.target.__data__;
    })
    .append('title')
    .text(d=>d.name);

    //timelinechart
    const margin = ({top: 30, right: 30, bottom: 30, left: 30})
    const x: any = d3.scaleTime()
    //@ts-ignore
    .domain([d3.min(timelineData, d =>new Date(d.startDate)), d3.max(timelineData, d => new Date(d.endDate))])
      .range([0, width - margin.left - margin.right])
      
    const  y= d3.scaleBand()
      .domain(d3.range(timelineData.length) as Iterable<string>)
      .range([0,heightTimeLineChart - margin.bottom - margin.top])
      .padding(0.2)


    const createTooltip = function(el: any) {
    el
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("top", 0)
    .style("opacity", 0)
    .style("background", "blue")
    .style("border-radius", "5px")
    .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
    .style("padding", "10px")
    .style("line-height", "1.3")
    .style("font", "11px sans-serif")
    }

    const getRect = function(d: any){
      //@ts-ignore
      const el = d3.select(this);
      const sx = x(new Date(d.startDate));
      const w = x(new Date(d.endDate)) - x(new Date(d.startDate));
      const isLabelRight =(sx > width/2 ? sx+w < width : sx-w>0);

      el.style("cursor", "pointer")

      el
        .append("rect")
        .attr("x", sx)
        .attr("height", y.bandwidth())
        .attr("width", w)
        .attr("fill", d.color);
      el
        .append("text")
        .text(d.event)
        .attr("x", sx+((w-(d.event.length*5))/2))
        .attr("y", 2)
        .attr("fill", "black")
        .style("text-anchor",  "center")
        .style("dominant-baseline", "hanging")
        .style("font-size","12px");
      el
        .append("text")
        .text(d.startLabel)
        .attr("x", sx+5)
        .attr("y", 20)
        .attr("fill", "black")
        .style("text-anchor",  "end")
        .style("dominant-baseline", "hanging")
        .style("font-size","10px");
      el
        .append("text")
        .text(d.endLabel)
        .attr("x", sx+w-5)
        .attr("y", 20)
        .attr("fill", "black")
        .style("text-anchor",  "start")
        .style("dominant-baseline", "hanging")
        .style("font-size","10px");

    }
    
    const axisTop = d3.axisTop(x)
    .tickPadding(2)
    const axisBottom = d3.axisBottom(x)
    .tickPadding(2)

    const getTooltipContent = function(d: any) {
      return `<b>${d.company}</b>
      <br/>
      ${d.startDate} - ${d.endDate}
      `
    }

     const svg1 = d3.select('#timeLineChart').append('svg')
      .attr('width', width)
      .attr('height', heightTimeLineChart);

    const g1 = svg1.append("g").attr("transform", (d,i)=>`translate(${margin.left} ${margin.top})`);

    const groups = g1
    .selectAll("g")
    .data(timelineData)
    .enter()
    .append("g")
    .attr("class", "civ")
    .join('g')


    const tooltip =  d3.select("#tooltip").call(createTooltip);

    const line = svg1.append("line").attr("y1", margin.top-10).attr("y2", heightTimeLineChart-margin.bottom).attr("stroke", "rgba(0,0,0,0.2)").style("pointer-events","none");

    groups.attr("transform", (d,i)=>{
    //@ts-ignore
      return `translate(0 ${y(i)})`})

    groups
      .each(getRect)
      .append("title")
      .text(d => d.company + '\n'+d.startDate+" - "+ d.endDate)

    const milestonePoints = groups.append('g')
    .attr(
      'transform',
      (d, i) =>
      //@ts-ignore
        `translate(${x(new Date(d.milestoneDate))} 25)`
    )
    .attr('fill',"#66d")
    .text(d=>d.milestoneDate);
    var sym = 
    d3.symbol().type(d3.symbolStar).size(100);
    milestonePoints.append('path')
    .attr('d', sym)
    .attr("fill", "yellow")
    .attr('stroke','#000')
    .append('title')
    .text(d=>d.company + '\n'+d.event+"\n"+"milestone date - "+ d.milestoneDate);

    

    svg1
      .append("g")
      .attr("transform", (d,i)=>`translate(${margin.left} ${margin.top-10})`)
      .call(axisTop)

    svg1
      .append("g")
      .attr("transform", (d,i)=>`translate(${margin.left} ${heightTimeLineChart-margin.bottom})`)
      .call(axisBottom)
    

  }

}
