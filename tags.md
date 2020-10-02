---
layout: default
title: "Tags"
---
<main aria-label="Content">
  <div class="wrapper">
    <header>
      <h1>{{ page.title }}</h1>
    </header>
    <div itemprop="articleBody">
      {% for tag in site.tags %}
        <h3>{{ tag[0] }}</h3>
        <ul>
        {% for post in tag[1] %}
          <li><a href="{{ post.url }}">{{ post.title }}</a></li>
        {% endfor %}
        </ul>
      {% endfor %}
    </div>
  </div>
</main>
