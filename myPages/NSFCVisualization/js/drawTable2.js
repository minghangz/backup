part2 = {
    margin: {top:230, bottom:10, left:50, right:10},
    width: 500,
    height: 400,
    maxNum: 50,
    ids: ["教育部", "中国科学院", "工,交,农,医,国防等部门", "各省,自治区,市(直)"],
    //预处理数据
    preProcess: function(d){
        let ministries = []
        let departments = [];
        for(let i = 0; i < d.length; i+=2){
            let item = d[i];
            if(item["科学部"] == "合计"){
                for(let id = 0; id < part2.ids.length; id++){
                    ministries.push({
                        "部门": part2.ids[id], 
                        "项数": item[part2.ids[id] + ":项数"], 
                        "金额": item[part2.ids[id] + ":金额"],
                        "占比": d[i + 1][part2.ids[id] + ":项数"]
                    });
                }
            } 
            else{
                for(let id = 0; id < part2.ids.length; id++){
                    item[part2.ids[id] + ":占比"] = d[i + 1][part2.ids[id] + ":项数"];
                }
                departments.push(item);
            }
        }
        return {"科学部": departments, "部门": ministries};
    },
    //绘制坐标轴
    drawAxis: function(g){
        part2.xScale = d3.scaleBand()
            .domain(part2.ids)
            .range([0, part2.width]);
        part2.yScale = d3.scaleLinear()
            .domain([part2.maxNum, 0])
            .range([0, part2.height]);
        let yAxis = d3.axisRight(part2.yScale);
        let axis = g.append("g");
        for(let id = 0; id < part2.ids.length; id++){
            axis.append("g")
                .attr("transform", "translate("+(part2.margin.left+part2.xScale(part2.ids[id]))+","+part2.margin.top+")")
                .call(yAxis);
            axis.append("text")
                .attr("transform", "translate("+(part2.margin.left+part2.xScale(part2.ids[id]))+","+(part2.margin.top - 20)+")")
                .attr("text-anchor", "middle")
                .attr("font-size", 13)
                .text(part2.ids[id]);
        }
        return g;
    },
    // 绘制平行坐标图
    drawChart: function(data){
        let svg = d3.select(".table2");
        let g = svg.append("g")
            .attr("width", part2.width)
            .attr("height", part2.height);
        part2.drawAxis(g);
        let gs = g.selectAll(".data")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "data");
        for(let i = 1; i < part2.ids.length; i++){
            gs.append("line")
                .attr("x1", part2.margin.left + part2.xScale(part2.ids[i - 1]))
                .attr("y1", d => part2.margin.top + part2.yScale(d[part2.ids[i - 1] + ":项数"]))
                .attr("x2", part2.margin.left + part2.xScale(part2.ids[i]))
                .attr("y2", d => part2.margin.top + part2.yScale(d[part2.ids[i] + ":项数"]))
                .attr("opacity", 0.8)
                .attr("stroke-width", 3)
                .attr("stroke", d => part2.colorScale(d["科学部"]))
                .attr("stroke-linecap", "round");
        }
        for(let i = 0; i < part2.ids.length; i++){
            gs.append("circle")
                .attr("cx", part2.margin.left + part2.xScale(part2.ids[i]))
                .attr("cy", d => part2.margin.top + part2.yScale(d[part2.ids[i] + ":项数"]))
                .attr("r", 4)
                .attr("opacity", 0.8)
                .attr("fill", d => part2.colorScale(d["科学部"]));
        }
    },
    // 绘制上方条形图及标题
    drawTotalChart: function(data){
        let height = 100, width = 20;
        let yScale = d3.scaleLinear()
            .domain([d3.max(data.map(d => d["项数"])), 0])
            .range([0, height]);
        let svg = d3.select(".table2");
        let g = svg.append("g");
        let gs = g.selectAll(".miniData")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "miniData");
        gs.append("rect")
            .attr("width", width)
            .attr("height", d => height - yScale(d["项数"]))
            .attr("x", d => part2.xScale(d["部门"]) + part2.margin.left - width/2)
            .attr("y", d => yScale(d["项数"]) + 90)
            .attr("fill", "rgb(188, 189, 34)")
        gs.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", function(d){
                let x = part2.xScale(d["部门"]) + part2.margin.left;
                let y = yScale(d["项数"]) + 85;
                return "translate("+x+","+y+")";
            })
            .attr("font-size", 10)
            .text(d => d["项数"]+"("+d["占比"]+"%)");
        svg.append("text")
            .attr("font-size", "26")
            .attr("transform", "translate(20, 50)")
            .text("各学部资助项目统计（按隶属关系）");
    },
    // 添加交互事件
    addEvent: function(){
        let width = 300, height = 100;
        let gs = d3.selectAll(".table2 .data");
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
                    "教育部："+d["教育部:项数"]+"项，"+d["教育部:金额"]+"万元（"+d["教育部:占比"]+"%）<br/>"+
                    "中国科学院："+d["中国科学院:项数"]+"项，"+d["中国科学院:金额"]+"万元（"+d["中国科学院:占比"]+"%）<br/>"+
                    "工,交,农,医,国防等部门："+d["工,交,农,医,国防等部门:项数"]+"项，"+d["工,交,农,医,国防等部门:金额"]+"万元（"+d["工,交,农,医,国防等部门:占比"]+"%）<br/>"+
                    "各省,自治区,市(直)："+d["各省,自治区,市(直):项数"]+"项，"+d["各省,自治区,市(直):金额"]+"万元（"+d["各省,自治区,市(直):占比"]+"%）<br/>");
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
        d3.csv("data/table2.csv", function(d){
            for (let v_dim in d) {
                if(v_dim != "科学部"){
                    d[v_dim] = "0" + d[v_dim];
                    d[v_dim] = parseFloat(d[v_dim]);
                }
            }
            return d;
        }).then(function(d){
            part2.data = part2.preProcess(d);
            part2.colorScale = d3.scaleOrdinal()
                .domain(part2.data["科学部"].map(d => d["科学部"]))
                .range(d3.schemeCategory10);
            part2.drawChart(part2.data["科学部"]);
            part2.drawTotalChart(part2.data["部门"]);
            part2.addEvent();
        }); 
    }
};
part2.init();