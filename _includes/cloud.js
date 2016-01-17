var words = [
{% for item in items %}
    { text: "{{ item | first }}", weight: {{ item | last | size | times: 100 | divided_by: items.size }}, link: '#{{ item | first | slugize }}' }{% unless forloop.last %}, {% endunless %}
{% endfor %}
];

$('#cloud').jQCloud(words, {
    autoResize: true
});