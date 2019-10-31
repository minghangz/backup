part3 = {
    margin: {top:230, bottom:10, left:50, right:10},
    width: 500,
    height: 400,
    maxNum: 80,
    ids: ["高等院校", "科研单位", "其他"],
    //预处理数据
    preProcess: function(d){
        let ministries = []
        let departments = [];
        for(let i = 0; i < d.length; i+=2){
            let item = d[i];
            if(item["科学部"] == "合计"){
                for(let id = 0; id < part3.ids.length; id++){
                    ministries.push({
                        "单位性质": part3.ids[id], 
                        "项数": item[part3.ids[id] + ":项数"], 
                        "金额": item[part3.ids[id] + ":金额"],
                        "占比": d[i + 1][part3.ids[id] + ":项数"]
                    });
                }
            } 
            else{
                for(let id = 0; id < part3.ids.length; id++){
                    item[part3.ids[id] + ":占比"] = d[i + 1][part3.ids[id] + ":项数"];
                }
                departments.push(item);
            }
        }
        return {"科学部": departments, "单位性质": ministries};
    },
    //绘制坐标轴
    drawAxis: function(g){
        part3.xScale = d3.scaleBand()
            .domain(part3.ids)
            .range([0, part3.width]);
        part3.yScale = d3.scaleLinear()
            .domain([part3.maxNum, 0])
            .range([0, part3.height]);
        let yAxis = d3.axisRight(part3.yScale);
        let axis = g.append("g");
        for(let id = 0; id < part3.ids.length; id++){
            axis.append("g")
                .attr("transform", "translate("+(part3.margin.left+part3.xScale(part3.ids[id]))+","+part3.margin.top+")")
                .call(yAxis);
            axis.append("text")
                .attr("transform", "translate("+(part3.margin.left+part3.xScale(part3.ids[id]))+","+(part3.margin.top - 20)+")")
                .attr("text-anchor", "middle")
                .attr("font-size", 13)
                .text(part3.ids[id]);
        }
        return g;
    },
    // 绘制平行坐标图
    drawChart: function(data){
        let svg = d3.select(".table3");
        let g = svg.append("g")
            .attr("width", part3.width)
            .attr("height", part3.height);
        part3.drawAxis(g);
        let gs = g.selectAll(".data")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "data");
        for(let i = 1; i < part3.ids.length; i++){
            gs.append("line")
                .attr("x1", part3.margin.left + part3.xScale(part3.ids[i - 1]))
                .attr("y1", d => part3.margin.top + part3.yScale(d[part3.ids[i - 1] + ":项数"]))
                .attr("x2", part3.margin.left + part3.xScale(part3.ids[i]))
                .attr("y2", d => part3.margin.top + part3.yScale(d[part3.ids[i] + ":项数"]))
                .attr("opacity", 0.8)
                .attr("stroke-width", 3)
                .attr("stroke", d => part3.colorScale(d["科学部"]))
                .attr("stroke-linecap", "round");
        }
        for(let i = 0; i < part3.ids.length; i++){
            gs.append("circle")
                .attr("cx", part3.margin.left + part3.xScale(part3.ids[i]))
                .attr("cy", d => part3.margin.top + part3.yScale(d[part3.ids[i] + ":项数"]))
                .attr("r", 4)
                .attr("opacity", 0.8)
                .attr("fill", d => part3.colorScale(d["科学部"]));
        }
    },
    // 绘制上方条形图及标题
    drawTotalChart: function(data){
        let height = 100, width = 20;
        let yScale = d3.scaleLinear()
            .domain([d3.max(data.map(d => d["项数"])), 0])
            .range([0, height]);
        let svg = d3.select(".table3");
        let g = svg.append("g");
        let gs = g.selectAll(".miniData")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "miniData");
        gs.append("rect")
            .attr("width", width)
            .attr("height", d => height - yScale(d["项数"]))
            .attr("x", d => part3.xScale(d["单位性质"]) + part3.margin.left - width/2)
            .attr("y", d => yScale(d["项数"]) + 90)
            .attr("fill", "rgb(188, 189, 34)")
        gs.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", function(d){
                let x = part3.xScale(d["单位性质"]) + part3.margin.left;
                let y = yScale(d["项数"]) + 85;
                return "translate("+x+","+y+")";
            })
            .attr("font-size", 10)
            .text(d => d["项数"]+"("+d["占比"]+"%)");
        svg.append("text")
            .attr("font-size", "26")
            .attr("transform", "translate(20, 50)")
            .text("各学部资助项目统计（按单位性质）");
    },
    // 添加交互事件
    addEvent: function(){
        let width = 240, height = 80;
        let gs = d3.selectAll(".table3 .data");
        //鼠标悬浮显示提示框
        gs.on("mouseover", function(d){
            d3.selectAll(".data").attr("switched", function(data){
                return data["科学部"] == d["科学部"];
            });
            part4.drawMap(d["科学部"]);
            d3.select(".details")
                .style("display", "block")
                .style("left", (d3.event.pageX - width) + "px")
                .style("top", (d3.event.pageY - height) + "px")
                .style("width", width+"px")
                .style("height", height+"px")
                .html("<b>"+d["科学部"]+"</b><br/>"+
                    "高等院校："+d["高等院校:项数"]+"项，"+d["高等院校:金额"]+"万元（"+d["高等院校:占比"]+"%）<br/>"+
                    "科研单位："+d["科研单位:项数"]+"项，"+d["科研单位:金额"]+"万元（"+d["科研单位:占比"]+"%）<br/>"+
                    "其他："+d["其他:项数"]+"项，"+d["其他:金额"]+"万元（"+d["其他:占比"]+"%）<br/>");
        });
        gs.on("mousemove", function(d){
            d3.selectAll(".data").attr("switched", function(data){
                return data["科学部"] == d["科学部"];
            });
            part4.drawMap(d["科学部"]);
            d3.select(".details")
            .style("left", (d3.event.pageX - width) + "px")
            .style("top", (d3.event.pageY - height) + "px")
            .style("width", width+"px")
            .style("height", height+"px")
        });
        gs.on("mouseout", function(d){
            d3.selectAll(".data").attr("switched", false);
            part4.drawMap("合计");
            d3.select(".details")
                .style("display", "none");
        });
        return gs;
    },
    //主程序
    init: function(){
        d3.csv("data/table3.csv", function(d){
            for (let v_dim in d) {
                if(v_dim != "科学部"){
                    d[v_dim] = "0" + d[v_dim];
                    d[v_dim] = parseFloat(d[v_dim]);
                }
            }
            return d;
        }).then(function(d){
            part3.data = part3.preProcess(d);
            part3.colorScale = d3.scaleOrdinal()
                .domain(part3.data["科学部"].map(d => d["科学部"]))
                .range(d3.schemeCategory10);
            part3.drawChart(part3.data["科学部"]);
            part3.drawTotalChart(part3.data["单位性质"]);
            part3.addEvent();
        }); 
    }
};
part3.init();