---
layout: default
title: "macho199 Blog"
---
<main aria-label="Content">
  <div class="wrapper">
    <header>
      <h1>Posts</h1>
    </header>
    <div itemprop="articleBody">
      <ul>
        {% for post in site.posts %}
          <li>
            <a href="{{ post.url }}">{{ post.title }}</a>
          </li>
        {% endfor %}
      </ul>
    </div>
  </div>
</main>
