queue()
    .defer(d3.csv, 'data/cleaned_survey_results_2019.csv')
    .await(makeOrdinalVis);

var question1 = "Have you studied data visualization in school (or other formal environment) or did you learn how to do it on your own?";
var question2 = "";
var question1_index = 0;
var question2_index = 0;
var question1_category_limit = 7;
var question2_category_limit = 10;
var sequential_pallete1 = ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7', '#f7fbff'];
var diverging_pallete1 = ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'];
var treemap = d3.treemap().size([1, 1]);
var selected_legend_index = null;
const font_size = 15;

function makeOrdinalVis(error, data){
  	if(error){
  		console.log(error);
  	}

    const svg_margin = {
        top: 100,
        bottom: 50,
        left: 50,
        right: 50
    };
    const width = document.getElementById("ordinal-vis").offsetWidth - svg_margin.left - svg_margin.right;
    const height = 700;
    var svg = d3.select("#ordinal-vis").append("svg")
        .attr("width", width + svg_margin.left + svg_margin.right)
        .attr("height", height + svg_margin.top + svg_margin.bottom)
        .append("g")
        .attr("transform", "translate(" + svg_margin.left + ", " + svg_margin.top + ")");

    data.forEach(function(response){   
        for(var question in response){
            if(!isNaN(response[question]) && response[question]!== ""){
                response[question] = parseInt(response[question]);
            } else{
                if(response[question] == undefined){
                    response[question] = []
                    continue;
                }

                var categories = response[question].replace(/ *\([^)]*\) */g, "").split(",");
                for(var i in categories){
                    categories[i] = categories[i].trim();
                }
                response[question] = categories;
            }
        }
    });

    var vis_svg = svg.append('g')



    $('#question1-selection').select2();
    $('#question2-selection').select2();

    setDropdownData();
    updateVisualization();

    $('#question1-selection').on('select2:select', function (e) {
        question1 = e.params.data.text;   
        question1_index = e.params.data.id;

        setDropdownData();
        updateVisualization();
    });

    $('#question2-selection').on('select2:select', function (e) {
        question2 = e.params.data.text;
        question2_index = e.params.data.id;
        if(question2 == "None") question2 = "";

        setDropdownData();
        updateVisualization();
    });

    $("#exchange_image").on("click", function(d){
        if(question2 == "") return;

        var dummy = question1;
        question1 = question2;
        question2 = dummy;

        dummy = question1_index;
        question1_index = question2_index - 1;
        question2_index = dummy + 1;

        setDropdownData();
        updateVisualization();
    })


    function frequency(array){
        var result = {}
        for(var i in array){
            if(Object.keys(result).indexOf(array[i]) < 0){
                result[array[i]] = 0
            }
            result[array[i]] += 1;
        }

        var frequency_array = [];
        for(var i in result){
            frequency_array.push([i, result[i]]);
        }

        frequency_array.sort(function(a, b){return b[1] - a[1]})
        return frequency_array;
    }

    function getCategoricalData(){
        var result = {};

        a1 = [];
        a2 = [];
        for(var i in data){
            if(data[i][question1] != "") a1.push.apply(a1, data[i][question1]);
            if(data[i][question2] != ""){
                if(question2 != "") a2.push.apply(a2, data[i][question2]);
            }
            
        }

        f1 = frequency(a1);
        f2 = frequency(a2);

        category1 = [];
        category2 = [];
        for(var i = 0; i < question1_category_limit && i < f1.length; i++){
            category1.push(f1[i][0]);
        }
        if(category1.length == question1_category_limit) category1.push("Others");
        for(var i = 0; i < question2_category_limit && i < f2.length; i++){
            category2.push(f2[i][0]);
        }
        if(category2.length == question2_category_limit) category2.push("Others");

        for(var i in category1){
            result[category1[i]] = 0;

            if(question2 !== ""){
                result[category1[i]] = {};
                for(var j in category2){
                    result[category1[i]][category2[j]] = 0;
                }
            }
        }

        for(var d in data){
            for(var j in data[d][question1]){
                key1 = data[d][question1][j];
                if(key1 == "") continue;
                else if(Object.keys(result).indexOf(key1) < 0) key1 = "Others";
                

                if(question2 !== ""){
                    for(var k in data[d][question2]){
                        key2 = data[d][question2][k];
                        if(key2 == "") continue;
                        else if(Object.keys(result[key1]).indexOf(key2) < 0) key2 = "Others";

                        result[key1][key2] += 1;
                    }
                } else{
                    result[key1] += 1;
                }
            }
        }

        var result1 = [];
        var result2 = [];

        for(var i in result){
            if(question2 == ""){
                result1.push([i, result[i]])
            } else{
                var total = 0;
                var json = {
                    "name": i,
                    "children": []
                }
                for(var j in result[i]){
                    json["children"].push({
                        "name": j,
                        "count": result[i][j]
                    });
                    total += result[i][j]
                }
                result1.push([i, total]);
                json["children"].sort(function(a, b){return -a["count"] + b["count"]});
                result2.push(json);
            }
        }

        return {
            d1: result1,
            d2: result2
        };
    }

    function setDropdownData(){
        var parent_ids = 32;
        var children_ids = 0;
        var select2_data = [];
        for(var category in category_questions){
            d = {
                id: parent_ids++,
                text: category,
                children: []
            }

            for(var j in category_questions[category]){
                if(category_questions[category][j] == question2) continue;
                d.children.push({
                    id: children_ids++,
                    text: category_questions[category][j]
                });
            }

            select2_data.push(d);
        }

        $('#question1-selection').empty().select2({
            data: select2_data
        });
        $('#question1-selection').val(question1_index).trigger("change");



        var parent_ids = 32;
        var children_ids = 0;
        var select2_data = [];
        select2_data.push({
            id: children_ids++,
            text: "None"
        });

        for(var category in category_questions){
            d = {
                id: parent_ids++,
                text: category,
                children: []
            }


            for(var j in category_questions[category]){
                if(category_questions[category][j] == question1) continue;
                d.children.push({
                    id: children_ids++,
                    text: category_questions[category][j]
                });
            }

            select2_data.push(d);
        }


        $('#question2-selection').empty().select2({
            data: select2_data
        });
        $('#question2-selection').val(question2_index).trigger("change");

    }

    function updateVisualization(){
        visualization_data = getCategoricalData();
        max_value = d3.max(visualization_data.d1, function(d){return d[1]})
        max_height = width/(visualization_data.d1.length);
        if(max_height > 400) max_height = 400;
        var legend_offset = 0;

        vis_svg.transition().duration(500).style("opacity", 0)
            .on("end", function(){
                vis_svg.remove();
                vis_svg = svg.append("g").style("opacity", 0);

                for(var i in visualization_data.d1){
                    var w = Math.sqrt(visualization_data.d1[i][1]/max_value)*max_height;
                    
                    var g = vis_svg.append("g")
                        .attr("transform", "translate(" + (i*max_height + max_height/2) + ", 0)");

                    var div = g.append("foreignObject")
                        .attr("x", -max_height/2)
                        .attr("y", max_height + 5) 
                        .attr("width", max_height) // replace with width you want 
                        .attr("height", 100)// replace with height you want
                        .append("xhtml:div")// replace with html element you want
                        .attr("class", "center")
                        .append("p")
                        .text(visualization_data.d1[i][0]);

                    if($(div._groups[0][0]).innerHeight() > legend_offset) legend_offset = $(div._groups[0][0]).innerHeight() 

                    if(question2 !== ""){
                        treemap.size([w, w]);

                        var root = d3.hierarchy(visualization_data.d2[i], (d) => d.children).sum((d) => d["count"]);
                        var tree = treemap(root);
                        var node = g.datum(root).selectAll(".node")
                                    .data(tree.leaves())
                                    .enter().append("rect")
                                    .attr("x", (d) => d.x0 - w/2)
                                    .attr("y", function(d, i){
                                        return max_height - d.y0 - Math.max(0, d.y1 - d.y0  - 1);
                                    })
                                    .attr("width", (d) => Math.max(0, d.x1 - d.x0 - 1))
                                    .attr("height", (d) => Math.max(0, d.y1 - d.y0  - 1))
                                    .attr("fill", (d, i) => diverging_pallete1[i])
                                    .on("mouseover", function(d, i){
                                        d3.select("#legend_" + selected_legend_index)
                                            .attr("font-weight", "normal");

                                        selected_legend_index = i;
                                        d3.select("#legend_" + selected_legend_index)
                                            .attr("font-weight", "bold");
                                    })
                                    .on("mouseout", function(){
                                        d3.select("#legend_" + selected_legend_index)
                                            .attr("font-weight", "normal");
                                        selected_legend_index = null;
                                    })

                    } else{  
                        g.append("rect")
                            .attr("x", -w/2)
                            .attr("y", max_height - w)
                            .attr("width", w)
                            .attr("height", w)
                            .attr("fill", sequential_pallete1[i]);
                    }
                }

                // Legend
                if(question2 !== ""){
                    var category2 = visualization_data.d2[0]["children"]
                    for(var i in category2){
                        vis_svg.append("rect")
                            .attr("x", 0)
                            .attr("y", max_height + 50 + parseInt(i)*25 + legend_offset)
                            .attr("width", 20)
                            .attr("height", 20)
                            .attr("fill", diverging_pallete1[i]);
                        vis_svg.append("text")
                            .attr("x",  25)
                            .attr("y", max_height + 50 + parseInt(i)*25 + 10 + legend_offset)
                            .attr("id", (d, e) => "legend_" + i)
                            .attr("alignment-baseline", "middle")
                            .attr("dominant-baseline", "middle")
                            .text(category2[i]["name"])
                    }
                }

                vis_svg.transition().duration(500).style("opacity", 1)

            });
    }

}


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
