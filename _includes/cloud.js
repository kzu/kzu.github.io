{% assign items = include.items %}

var words = [
{% for item in items %}
    { text: "{{ item | first }}", weight: {{ item | last | size | times: 100 | divided_by: items.size }}, link: baseUrl + '#{{ item | first | slugize }}' }{% unless forloop.last %}, {% endunless %}
{% endfor %}
];

// We need 100px (minimum height for one row of tags) plus 
// 100px per higher-than-x% tag, since those are big and 
// can only fit one per row
var isBig = function(weight) { return weight >= 40 }; 
var big = words.map(function (word) { return word.weight }).filter(isBig).length;

$('#cloud').jQCloud(words, {
    autoResize: true,
    height: (150 + (100 * big)),
    removeOverflowing: false
});