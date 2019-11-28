var days_margin = {"top": 130, "left":30};
var hours_margin = {"top": 80, "left": 40};
var total_margin = {"top": 60, "left": 30};
var pixel_width = 12;
var pixel_height = 10;
var xScale, yScale, cityScale, width = 1000, height = 350;;

function AQI2Color(aqi){
    if(aqi > 500)
        aqi = 500;
    if(aqi <= 50)
        return d3.interpolate(d3.rgb(67,206,23), d3.rgb(239,220,49))(aqi / 50);
    if(aqi <= 100)
        return d3.interpolate(d3.rgb(239,220,49), d3.rgb(255,170,0))((aqi - 50) / 50);
    if(aqi <= 150)
        return d3.interpolate(d3.rgb(255,170,0), d3.rgb(255,64,26))((aqi - 100) / 50);
    if(aqi <= 200)
        return d3.interpolate(d3.rgb(255,64,26), d3.rgb(210,0,64))((aqi - 150) / 50);
    if(aqi <= 300)
        return d3.interpolate(d3.rgb(210,0,64), d3.rgb(156,10,78))((aqi - 200) / 100);
    return d3.interpolate(d3.rgb(156,10,78), d3.rgb(92,2,2))((aqi - 300) / 200);
}

function AQI2Level(aqi){
    if(aqi <= 50)
        return "优";
    if(aqi <= 100)
        return "良";
    if(aqi <= 150)
        return "轻度污染";
    if(aqi <= 200)
        return "中度污染";
    if(aqi <= 300)
        return "重度污染";
    return "严重污染";
}

function preProcess(d){
    monthes = []
    month = {
        "id": Math.floor(d[0]["日期"]/100),
        "date": Math.floor(d[0]["日期"]/100)+"月",
        "days":[],
        "AQI":0.0
    }
    day = {
        "id": d[0]["日期"]%100,
        "date": d[0]["日期"]+"日",
        "hours":[],
        "AQI":0.0
    }
    hour = {
        "id":d[0]["时间"],
        "AQI":d[0]["AQI"],
        "date":d[0]["日期"]+"日"+d[0]["时间"]+"点"
    }
    for(let i = 1; i < d.length; i++){
        day["hours"].push(hour);
        day["AQI"] += hour["AQI"];
        hour = {
            "id":d[i]["时间"],
            "AQI":d[i]["AQI"],
            "date":d[i]["日期"]+"日"+d[i]["时间"]+"点"
        }
        if(d[i]["日期"]%100 != day["id"]){
            day["AQI"] = Math.round(day["AQI"]/day["hours"].length);
            month["days"].push(day);
            month["AQI"] += day["AQI"];
            day = {
                "id": d[i]["日期"]%100,
                "date": d[i]["日期"]+"日",
                "hours":[],
                "AQI":0.0
            }
        }
        if(Math.floor(d[i]["日期"]/100) != month["id"]){
            month["AQI"] = Math.round(month["AQI"]/month["days"].length);
            monthes.push(month);
            month = {
                "id": Math.floor(d[i]["日期"]/100),
                "date": Math.floor(d[i]["日期"]/100)+"月",
                "days":[],
                "AQI":0.0
            }
        }
    }
    day["hours"].push(hour);
    day["AQI"] += hour["AQI"];
    day["AQI"] = Math.round(day["AQI"]/day["hours"].length);
    month["days"].push(day);
    month["AQI"] += day["AQI"];
    month["AQI"] = Math.round(month["AQI"]/month["days"].length);
    monthes.push(month);
    return monthes;
}

function drawDays(g, data){
    let gs = g.select(".days")
        .selectAll(".month")
        .data(data)
        .join(enter=>enter.append("g").attr("class", "month"))
        .attr("transform", (d, i) =>
            "translate(0,"+(pixel_height * i + days_margin.top)+")");
    gs.append("text")
        .attr("font-size", 8)
        .attr("y", 8)
        .text(d => d["id"]);
    gs.selectAll(".day")
        .data(d => d["days"])
        .join(enter=>enter.append("rect").attr("class", "day"));
    gs.selectAll(".day")
        .attr("width", pixel_width - 1)
        .attr("height", pixel_height - 1)
        .attr("x", d => (d["id"]-1)*pixel_width + days_margin.left)
        .attr("y", 0)
        .attr("fill", d => AQI2Color(d["AQI"]));
}

function drawHours(g, data, month){
    let gs = g.select(".hours")
        .selectAll(".day")
        .data(data)
        .join(enter=>enter.append("g").attr("class", "day"));
    gs.attr("transform", (d, i) =>
            "translate(0,"+(pixel_height * i + hours_margin.top)+")");
    gs.selectAll("text").data(d=>[d["id"]])
        .join(enter=>enter.append("text"))
        .attr("font-size", 8)
        .attr("y", 8)
        .text(function(d){
            if(d < 10)
                return month+"0"+d;
            return ""+month+d;
        });
    gs.selectAll(".hour")
        .data(d => d["hours"])
        .join(enter=>enter.append("rect").attr("class", "hour"));
    gs.selectAll(".hour")
        .attr("width", pixel_width - 1)
        .attr("height", pixel_height - 1)
        .attr("x", d => d["id"]*pixel_width + hours_margin.left)
        .attr("y", 0)
        .attr("fill", d => AQI2Color(d["AQI"]));
    g.select(".hours")
        .attr("transform", "translate(600, 0)");
}

function drawTitle(g, city){
    g.append("text")
        .attr("class", "title")
        .attr("font-weight", "bold")
        .attr("x", 0)
        .attr("y", 30)
        .attr("font-size", 20)
        .text("2017~2018年"+city+"空气质量（AQI）（按天统计）");
    g.append("text")
        .attr("class", "title")
        .attr("font-weight", "bold")
        .attr("x", 580)
        .attr("y", 30)
        .attr("font-size", 20)
        .text(city+"全月空气质量（AQI）（按小时统计）");
    let g1 = g.append("g").attr("class", "scale");
    g1.selectAll("rect").data(d3.range(100))
        .join(enter=>enter.append("rect"))
        .attr("x", d => d*4+4)
        .attr("y", days_margin.top-50)
        .attr("width", 4)
        .attr("height", 10)
        .attr("fill", d => AQI2Color(d*5));
    g1.selectAll(".ticks").data([0, 50, 100, 150, 200, 300, 500])
        .join(enter=>enter.append("text").attr("class", "ticks"))
        .attr("x", d => d*4/5+4)
        .attr("y", days_margin.top-30)
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .text(d => d);
    g1.selectAll(".levels")
        .data([[25,"优"],[75,"良"],[125,"轻度污染"],[175,"中度污染"],[250,"重度污染"],[400,"严重污染"]])
        .join(enter=>enter.append("text").attr("class", "levels"))
        .attr("x", d => d[0]*4/5+4)
        .attr("y", days_margin.top-55)
        .attr("font-size", 8)
        .attr("text-anchor", "middle")
        .text(d => d[1]);
}

function draw(g, data){
    let g1 = g.append("g").attr("class", "days");
    g1.append("g").attr("class", "xlabel")
        .selectAll("text")
        .data(d3.range(31))
        .join(enter=>enter.append("text"))
        .attr("font-size", 8)
        .attr("y", days_margin.top - 2)
        .attr("x", d => (d + 0.5) * pixel_width + days_margin.left)
        .attr("text-anchor", "middle")
        .text(d => d + 1);
    drawDays(g, data);

    g1 = g.append("g").attr("class", "hours");
    g1.append("g").attr("class", "xlabel")
        .selectAll("text")
        .data(d3.range(24))
        .join(enter=>enter.append("text"))
        .attr("font-size", 8)
        .attr("y", hours_margin.top - 2)
        .attr("x", d => (d + 0.5) * pixel_width + hours_margin.left)
        .attr("text-anchor", "middle")
        .text(d => d);
    drawHours(g, data[0]["days"], data[0]["id"]);
    g1.append("polyline")
        .attr("points", function(){
            let x1 = 0, x2 = 330;
            let y1 = hours_margin.top-12, y2 = hours_margin.top-12+330;
            return ""+x1+","+y1+" "+x2+","+y1+" "+x2+","+y2+" "+x1+","+y2;
        })
        .attr("fill", "none")
        .attr("stroke", "gray");
    g.append("line")
        .attr("x1", 31*pixel_width+days_margin.left)
        .attr("y1", days_margin.top+5)
        .attr("x2", 600)
        .attr("y2", hours_margin.top-12+330)
        .attr("stroke", "gray")
        .attr("class", "topLine");
    g.append("line")
        .attr("x1", 31*pixel_width+days_margin.left)
        .attr("y1", days_margin.top+5)
        .attr("x2", 600)
        .attr("y2", hours_margin.top-12)
        .attr("stroke", "gray")
        .attr("class", "bottomLine");
    return g;
}

function drawTotalAxis(){
    let monthes = [201701,201702,201703,201704,201705,201706,201707,201708,201709,201710,201711,
        201712,201801,201802,201803,201804,201805,201806,201807,201808,201809,201810,201811,201812];
    xScale = d3.scaleBand()
        .domain(monthes)
        .range([0, width - total_margin.left]);
    yScale = d3.scaleLinear()
        .domain([0, 200])
        .range([height - total_margin.top, 0]);
    cityScale = d3.scaleOrdinal()
        .domain(["北京", "上海", "广州", "成都"])
        .range(d3.schemeCategory10);
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisLeft(yScale);
    d3.select(".total").append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate('+total_margin.left+','+height+')')
        .call(xAxis);
    d3.select(".total").append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate('+total_margin.left+','+total_margin.top+')')
        .call(yAxis);
    d3.select(".total").append("text")
        .attr("class", "title")
        .attr("font-weight", "bold")
        .attr("x", 0)
        .attr("y", 30)
        .attr("font-size", 20)
        .text("2017~2018年北京、上海、广州、成都月平均空气质量（AQI）");
    let g = d3.select(".total").append("g");
    let gs = g.selectAll(".ex").data(["北京", "上海", "广州", "成都"])
        .join(enter=>enter.append("g").attr("class", "ex"));
    gs.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("y", (d, i)=>i*30)
        .attr("fill", d => cityScale(d));
    gs.append("text")
        .attr("x", 30)
        .attr("y", (d, i) => i*30+15)
        .text(d => d);
    g.attr("transform", "translate(800, 60)");
}

function drawTotalLine(data, city){
    let line = d3.line()
        .x(d => xScale(d["id"]) + total_margin.left+xScale.step()/2)
        .y(d => yScale(d["AQI"]) + total_margin.top);
    d3.select(".total").append('path')
        .attr('class', 'line')
        .attr('d', line(data))
        .attr("fill", "none")
        .attr("stroke", cityScale(city));
    let gs = d3.select(".total").selectAll("points").data(data)
        .join(enter=>enter.append("circle").attr("class", "points"))
        .attr("r", 3)
        .attr("cx", d => xScale(d["id"]) + total_margin.left+xScale.step()/2)
        .attr("cy", d => yScale(d["AQI"]) + total_margin.top)
        .attr("fill", cityScale(city));
    gs.on("mouseover", function(d){
        d3.select(".details")
            .style("display", "block")
            .style("left", (d3.event.pageX+10) + "px")
            .style("top", (d3.event.pageY+10) + "px")
            .html("<b>"+d["date"]+" "+city+"：</b><br/>"+
                "月平均AQI："+d["AQI"]+"<br/>");
    });
    gs.on("mousemove", function(d){
        d3.select(".details")
            .style("display", "block")
            .style("left", (d3.event.pageX+10) + "px")
            .style("top", (d3.event.pageY+10) + "px")
            .html("<b>"+d["date"]+" "+city+"：</b><br/>"+
                "月平均AQI："+d["AQI"]+"<br/>");

    });
    gs.on("mouseout", function(d){
        d3.select(".details")
            .style("display", "none");
    });
}

function addEvents(g, city){
    let gs = g.selectAll(".month");
    gs.on("click", function(d, i){
        g.select(".topLine")
            .attr("y1", days_margin.top+i*10+5);
        g.select(".bottomLine")
            .attr("y1", days_margin.top+i*10+5);
        drawHours(g, d["days"], d["id"]);
    });
    gs = g.selectAll(".days .day, .hours .hour");
    gs.on("mouseover", function(d){
        d3.select(".details")
            .style("display", "block")
            .style("left", (d3.event.pageX+10) + "px")
            .style("top", (d3.event.pageY+10) + "px")
            .html("<b>"+d["date"]+" "+city+"：</b><br/>"+
                "AQI："+d["AQI"]+"<br/>"+
                "空气质量："+AQI2Level(d["AQI"]));
    });
    gs.on("mousemove", function(d){
        d3.select(".details")
            .style("display", "block")
            .style("left", (d3.event.pageX+10) + "px")
            .style("top", (d3.event.pageY+10) + "px")
            .html("<b>"+d["date"]+" "+city+"：</b><br/>"+
                "AQI："+d["AQI"]+"<br/>"+
                "空气质量："+AQI2Level(d["AQI"]));

    });
    gs.on("mouseout", function(d){
        d3.select(".details")
            .style("display", "none");
    });
}

drawTotalAxis();

d3.csv("data/beijing.csv", function(d) {
    for(let v_dim in d)
        d[v_dim] = parseInt(d[v_dim]);
    return d;
}).then(function(d){
    data = preProcess(d);
    let g = d3.select(".beijing");
    draw(g, data);
    drawTitle(g, "北京");
    drawTotalLine(data, "北京");
    addEvents(g, "北京");
});

d3.csv("data/shanghai.csv", function(d) {
    for(let v_dim in d)
        d[v_dim] = parseInt(d[v_dim]);
    return d;
}).then(function(d){
    data = preProcess(d);
    let g = d3.select(".shanghai");
    draw(g, data);
    drawTitle(g, "上海");
    drawTotalLine(data, "上海");
    addEvents(g, "上海");
});

d3.csv("data/guangzhou.csv", function(d) {
    for(let v_dim in d)
        d[v_dim] = parseInt(d[v_dim]);
    return d;
}).then(function(d){
    data = preProcess(d);
    let g = d3.select(".guangzhou");
    draw(g, data);
    drawTitle(g, "广州");
    drawTotalLine(data, "广州");
    addEvents(g, "广州");
});

d3.csv("data/chengdu.csv", function(d) {
    for(let v_dim in d)
        d[v_dim] = parseInt(d[v_dim]);
    return d;
}).then(function(d){
    data = preProcess(d);
    let g = d3.select(".chengdu");
    draw(g, data);
    drawTitle(g, "成都");
    drawTotalLine(data, "成都");
    addEvents(g, "成都");
});
