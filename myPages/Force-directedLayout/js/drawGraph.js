var nodesNum, nodes, edges, iterId = 0, k = 0.75;
var height = 800, width = 800;

/*预处理数据，得到点集和边集*/
function preProcess(d){
    edges = [];
    nodes = [];
    for(let i = 0; i < nodesNum; i++){
        let neighbors = [];
        for(let v_dim in d[i])
        if(d[i][v_dim] == 1){
            var j = parseInt(v_dim);
            neighbors.push(j);
            if(j <= i){
                edges.push([i, j]);
            }
        }
        nodes.push({
            id: i,
            neighbors: neighbors,
            /*对点的坐标随机初始化*/
            x: Math.random() * width,
            y: Math.random() * height,
            fixed: 0,
        });
    }
}

/*绘制点和边*/
function draw(){
    /*绑定并绘制边*/
    d3.select(".graph").selectAll(".edge")
        .data(edges)
        .enter()
        .append("line")
        .attr("class", "edge");
    d3.select(".graph").selectAll(".edge")
        .attr("x1", d => nodes[d[0]].x)
        .attr("y1", d => nodes[d[0]].y)
        .attr("x2", d => nodes[d[1]].x)
        .attr("y2", d => nodes[d[1]].y)
        .attr("stroke-width", 1)
        .attr("stroke", "gray")
        .attr("opacity", 0.2);
    /*绑定并绘制点*/
    d3.select(".graph").selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", "node");
    d3.select(".graph").selectAll(".node")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 2)
        .attr("fill", "black");
}

/*计算向量模长*/
function length(x, y){
    return Math.sqrt(x * x + y * y);
}

/*计算两点之间的距离*/
function dis(i, j){
    return length(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
}

/*斥力：(k^2)/(dist^alpha)*/
function getRepulsiveForce(k, alpha){
    return function(i, j){
        let tmp = Math.pow(dis(i, j), alpha + 1);
        if(tmp < 1) tmp = 1;
        let m = k * k / tmp;
        return [(nodes[i].x - nodes[j].x) * m, (nodes[i].y - nodes[j].y) * m];
    }
}

/*引力：(dist^alpha)/k*/
function getTracionForce(k, alpha){
    return function(i, j){
        let m = Math.pow(dis(i, j), alpha - 1) / k;
        return [(nodes[j].x - nodes[i].x) * m, (nodes[j].y - nodes[i].y) * m];
    }
}

/*迭代求解
  deta: 每次移动的步长
  beta: 一次移动的距离不仅和当前受力有关，还和之前的受力有关，beta控制与之前受力的相关性
  maxIter: 最大迭代次数
  repulsiveForce: 斥力函数
  tractionForce: 引力函数
*/
function iterate(delta, beta, maxIter, repulsiveForce, tracionForce){
    // f:受力 v:速度 changes:上一次循环的改变量 t:循环次数
    let f = [], v = [], changes = 0.0, t = 0; 
    for(let i = 0; i < nodesNum; i++){
        f.push([0.0, 0.0]);
        v.push([0.0, 0.0]);
    }
    //记录本次迭代求解的id，当改变参数开始下一次求解时，及时终止之前的求解
    iterId += 1;
    let id = iterId;
    //开始循环
    function loop(){
        //计算引力与斥力
        for(let i = 0; i < nodesNum; i++){
            for(let j = 0; j < nodesNum; j++)
            if(i != j){
                let f1 = repulsiveForce(i, j);
                f[i][0] += f1[0];
                f[i][1] += f1[1];
            }
            for(let j = 0; j < nodes[i].neighbors.length; j++){
                let f1 = tracionForce(i, nodes[i].neighbors[j]);
                f[i][0] += f1[0];
                f[i][1] += f1[1];
            }
        }
        //移动每个点
        for(let i = 0; i < nodesNum; i++){
            //移动的距离不仅与当前受力有关，还和之前的受力有关
            v[i][0] = beta * v[i][0] + (1 - beta) * f[i][0];
            v[i][1] = beta * v[i][1] + (1 - beta) * f[i][1];
            if(nodes[i].fixed){ //如果当前点是固定点，则该点受力平衡
                v[i][0] = v[i][1] = 0;
                f[i][0] = f[i][1] = 0;
            }
            let dx = delta * v[i][0];
            let dy = delta * v[i][1];
            //避免单次移动距离过长
            while(Math.abs(dx) > 100 || Math.abs(dy) > 100){
                dx /= 2;
                dy /= 2;
            }
            nodes[i].x += dx;
            nodes[i].y += dy;
            //记录受力最大的点的受力
            changes = Math.max(length(f[i][0], f[i][1]), changes);
            f[i][0] = 0;
            f[i][1] = 0;
        }
        if(t % 20 == 0) draw();//每20次循环渲染一次图像，动态展示收敛过程
        t += 1;
        //当最大受力比较小、或者超过最大迭代次数、或者因参数改变开始了新一次求解时，停止本次求解
        if(changes < 10 || t >= maxIter || id != iterId)
            return;
        changes = 0;
        setTimeout(() => {
            loop();
        }, 0);
    }
    //利用setTimeout使得渲染过程实时进行
    setTimeout(() => {
        loop();
        draw();
    }, 0);
}

/*为每个点添加拖动事件*/
function addDrag(){
    function dragMove(d) {
        d3.select(this)
            .attr("cx", d.x = d3.event.x)
            .attr("cy", d.y = d3.event.y);
        d3.select(".graph").selectAll(".edge")
            .attr("x1", d => nodes[d[0]].x)
            .attr("y1", d => nodes[d[0]].y)
            .attr("x2", d => nodes[d[1]].x)
            .attr("y2", d => nodes[d[1]].y);
        //正在被拖动的点设为固定点，迭代时不会被改变
        d.fixed = 1;
        iterate(0.01, 0.9, 5000, getRepulsiveForce(k, 1), getTracionForce(k, 2));
    }
    function dragEnd(d) {
        d3.select(this)
            .attr("cx", d.x = d3.event.x)
            .attr("cy", d.y = d3.event.y);
        d3.select(".graph").selectAll(".edge")
            .attr("x1", d => nodes[d[0]].x)
            .attr("y1", d => nodes[d[0]].y)
            .attr("x2", d => nodes[d[1]].x)
            .attr("y2", d => nodes[d[1]].y);
        //停止拖动时，取消固定该点
        d.fixed = 0;
        iterate(0.01, 0.9, 5000, getRepulsiveForce(k, 1), getTracionForce(k, 2));
    }
    let drag = d3.drag()
        .subject(function() {
            let t = d3.select(this);
            return {
                x: t.attr("cx"),
                y: t.attr("cy")
            };
        })
        .on("drag", dragMove)
        .on("end", dragEnd);
    d3.selectAll(".graph .node").call(drag);
}

//定义布画
d3.select("svg")
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "graph");
//读取数据
d3.csv("data/jazz.csv", function(d) {
    for(let v_dim in d)
        d[v_dim] = parseInt(d[v_dim]);
    return d;
}).then(function(d){
    nodesNum = d.length;
    preProcess(d);
    draw();
    addDrag();
    k = 0.75 * Math.sqrt(width * height / nodesNum);
    iterate(0.01, 0.9, 5000, getRepulsiveForce(k, 1), getTracionForce(k, 2));
});