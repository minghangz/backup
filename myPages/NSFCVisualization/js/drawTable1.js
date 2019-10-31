var part1 = {
    margin: {top:80, bottom:10, left:250, right:10},
    width: {"学科": 350, "学部":350},
    height: {"学科": 700, "学部":200},
    recPadding: 4,
    data: undefined,
    colorScale: undefined,
    
    //添加事件
    addEvent: function (gs){
        let width = 210, height = 190;
        //鼠标悬浮显示提示框
        gs.on("mouseover", function(d){
            d3.selectAll(".data").attr("switched", function(data){
                return data["科学部"] == d["科学部"];
            });
            part4.drawMap(d["科学部"]);
            d3.select(".details")
                .style("display", "block")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - height) + "px")
                .style("width", width+"px")
                .style("height", height+"px")
                .html("<b>"+d["学科"]+"</b><br/>"+
                    "受理申请项数："+d["受理申请项数"]+"<br/>"+
                    "受理申请金额："+d["受理申请金额"]+"万元<br/>"+
                    "批准资助项数："+d["批准资助项数"]+"<br/>"+
                    "批准资助金额："+d["批准资助金额"]+"万元<br/>"+
                    "单项平均资助金额："+d["单项平均资助金额"]+"万元<br/>"+
                    "资助金额比例（占全委）："+d["资助金额比例（占全委）"]+"%<br/>"+
                    "资助金额比例（占学部）："+d["资助金额比例（占学部）"]+"%<br/>"+
                    "资助率："+d["资助率（项数）"]+"%<br/>");
    
        });
        gs.on("mousemove", function(d){
            d3.selectAll(".data").attr("switched", function(data){
                return data["科学部"] == d["科学部"];
            });
            part4.drawMap(d["科学部"]);
            d3.select(".details")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY  - height) + "px")
                .style("width", width+"px")
                .style("height", height+"px")
        });
        gs.on("mouseout", function(d){
            d3.selectAll(".data").attr("switched", false);
            part4.drawMap("合计");
            d3.selectAll("this").attr("switched", false);
            d3.select(".details")
                .style("display", "none");
        });
        return gs;
    },
    //绘制数据项
    drawRec: function(gs, xScale, yScale){
        gs.append("rect")
            .attr("width", d => xScale(d["批准资助项数"]))
            .attr("height", yScale.step() - part1.recPadding)
            .attr("fill", d => this.colorScale(d["科学部"]));
        gs.append("rect")
            .attr("width", d => xScale(d["受理申请项数"]))
            .attr("height", yScale.step() - part1.recPadding)
            .attr("fill", d => this.colorScale(d["科学部"]))
            .attr("fill-opacity", 0.5);
        gs.append("text")
            .attr("text-anchor", "end")
            .attr("dx", -10)
            .attr("dy", (yScale.step() + 5)/2)
            .attr("font-size",8)
            .text(d => d["学科"]);
        gs.attr("transform", function(d, i){
            let x = part1.margin.left, y = part1.margin.top + yScale(i) + part1.recPadding / 2;
            return "translate("+x+","+y+")";
        })
        return gs;
    },
    //绘制条形图
    drawBarChart: function(data, title, width, height){
        //选择数据
        let svg = d3.select(".table1");
        let g = svg.append("g")
            .attr("width", width)
            .attr("height", height);
        //图表标题
        g.append("text")
            .attr("font-size", 20)
            .attr("dy", part1.margin.top/2)
            .attr("dx", part1.margin.left)
            .text(title);
        //定义比例尺
        let yScale = d3.scaleBand()
            .domain(d3.range(data.length))
            .rangeRound([0, height]);
        let xScale = d3.scaleLinear()
            .domain([0, d3.max(data.map(d => d["受理申请项数"]))])
            .range([0, width]);
        //绑定数据，绘图，添加事件
        let gs = g.selectAll(".data")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "data");
        part1.drawRec(gs, xScale, yScale);
        part1.addEvent(gs);
        //绘制坐标轴
        let xAxis = d3.axisTop(xScale);
        g.append("g")
            .attr("transform", "translate("+part1.margin.left+","+part1.margin.top+")")
            .call(xAxis);
        g.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height)
            .attr("stroke-width", 1)
            .attr("stroke", "rgb(0,0,0)")
            .attr("transform", "translate("+part1.margin.left+","+part1.margin.top+")");
        return g;
    },
    //将数据排序并更新坐标
    sort: function(type, key, order){
        let gs = d3.selectAll(".table1 ."+type+" .data");
        gs.sort(function(a, b){
            if(order){
                return b[key] - a[key];
            } else{
                return a[key] - b[key];
            }
        });
        let yScale = d3.scaleBand()
            .domain(d3.range(part1.data[type].length))
            .rangeRound([0, part1.height[type]]);
        gs = d3.select(".table1")
            .select("."+type)
            .selectAll(".data");
        gs.attr("transform", function(d, i){
            let x = part1.margin.left, y = part1.margin.top + yScale(i) + part1.recPadding / 2;
            return "translate("+x+","+y+")";
        })
    },
    //排序事件
    sortByApplication: function(){
        let btn=$(":focus");
        $(".part1 .order > span > span").text(btn.text());
        btn.toggleClass("up");
        let order=btn.hasClass("up");
        if(order){
            btn.find("span").text("降序\u2193");
        } else {
            btn.find("span").text("升序\u2191");
        }
        part1.sort("学科", "受理申请项数", order);
        part1.sort("学部", "受理申请项数", order);
    },
    sortByApproval: function(){
        let btn=$(":focus");
        $(".part1 .order > span > span").text(btn.text());
        btn.toggleClass("up");
        let order=btn.hasClass("up");
        if(order){
            btn.find("span").text("降序\u2193");
        } else {
            btn.find("span").text("升序\u2191");
        }
        part1.sort("学科", "批准资助项数", order);
        part1.sort("学部", "批准资助项数", order);
    },
    sortByRate: function(){
        let btn=$(":focus");
        $(".part1 .order > span > span").text(btn.text());
        btn.toggleClass("up");
        let order=btn.hasClass("up");
        if(order){
            btn.find("span").text("降序\u2193");
        } else {
            btn.find("span").text("升序\u2191");
        }
        part1.sort("学科", "资助率（项数）", order);
        part1.sort("学部", "资助率（项数）", order);
    },
    sortById: function(){
        $(".part1 .order > span > span").text("默认顺序");
        part1.sort("学科", "id", false);
        part1.sort("学部", "id", false);
    },
    //预处理数据，将学科和学部分离
    preProcess: function(d){
        let subjects = [];
        let departments = [];
        for (let i = 0; i < d.length; i++){
            let obj = d[i];
            if(obj["科学部"] == "合计") continue;
            if(obj["科学部"].indexOf("学部") == -1){
                obj["学科"] = obj["科学部"];
                obj["科学部"] = departments[departments.length - 1]["科学部"];
                obj["id"] = subjects.length;
                subjects.push(obj);
            } else {
                obj["学科"] = obj["科学部"];
                obj["id"] = departments.length;
                departments.push(obj);
            }
        }
        return {"学科":subjects, "学部":departments};
    },
    //主程序
    init: function(){
        d3.csv("data/table1.csv", function(d){
            for (let v_dim in d) {
                if(v_dim != "科学部"){
                    d[v_dim] = parseFloat(d[v_dim]);
                }
            }
            return d;
        }).then(function(d){
            part1.data = part1.preProcess(d);
            part1.colorScale = d3.scaleOrdinal()
                .domain(part1.data["学部"].map(d => d["科学部"]))
                .range(d3.schemeCategory10);
            part1.drawBarChart(part1.data["学科"], "各学科申请与资助项数统计", part1.width["学科"], part1.height["学科"])
                .attr("class", "学科");
            part1.drawBarChart(part1.data["学部"], "各学部申请与资助项数统计", part1.width["学部"], part1.height["学部"])
                .attr("transform", "translate(450, 0)")
                .attr("class", "学部");
        });
    }
};
part1.init();