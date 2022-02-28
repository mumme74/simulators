"use strict";

// add all possible tags here
const tags = {
  start:'Startsida',
  sim:'Simulator',
  math:'Matte',
  trigenometry: "Trigenometri",
  electrical:"Ellära",
  mechanical: "Mekanisk",
  gears: "Växlar",
  pneumatic:"Pneumatik",
  hydraulic:"Hydraulik",
  ac_electrical:'Växelströmslära',
  motors:"Elmotor",
};

// tags can be in many categories
const tagSubCategories = {
  start: {
    tags:[tags.start]
  },
  math: {
    tags:[tags.trigenometry]
  },
  electrical: {
    tags: [tags.motors, tags.ac_electrical],
    ac_electrical: {
      tags:[tags.motors]
    }
  },
  mechanical: {
    tags: [tags.gears]
  }
}

// add a new page here
const allPages = [
  {
    name:"Startsida", path:"/index.html",
    tags:[tags.start]
  },
  {
    name:"Sin-Cos simulator", path:"/pages/sin-cos/sin-cos.html",
    tags:[tags.math, tags.trigenometry, tags.sim]
  },
  {
    name:"Synkron-motor", path:"pages/motors/bldc/motor_synkron.html",
    tags:[tags.ac_electrical, tags.electrical, tags.motors]
  },
  {
    name:"3-Fas simulering", path:"pages/motors/three_phase.html",
    tags:[tags.ac_electrical, tags.motors]
  },
  {
    name:"Planetväxel", path:"pages/mechanical/planetary_gear.html",
    tags:[tags.mechanical, tags.gears]
  }
];

// ------------------ menu logic from here on -------------------

// sanitize key values
tags._ = (name)=>{
  // find tag key from tag string name
  const entries = Object.entries(tags);
  const itm = entries.find(e=>{if (e[1]===name) return e[0]});
  if (itm) return itm[0];
}

tags.__ = (arr)=>{
  // replace tag str names with keys instead
  return arr.map(t=>tags._(t));
}

allPages.forEach(p=>p.tags=tags.__(p.tags));
(function sani(obj) {
  for(let o in obj) {
    if (!obj.hasOwnProperty(o)) continue;
    if (o === 'tags') obj[o] = tags.__(obj[o]);
    else if (obj[o] !== undefined && typeof obj[o] === 'object')
      sani(obj[o]);
  }
})(tagSubCategories);



export class Menu {
  constructor(parentElement) {
    this.rootFolder = location.hostname == 'localhost' ? "" : "simulators";
    this.root = parentElement;
    const header = document.createElement("header");
    this.root.appendChild(header);

    this.search = document.createElement("input");
    this.search.type = "text";
    this.search.placeholder = "Sök efter sida"
    this.search.addEventListener("input", this.onSearch.bind(this));
    header.appendChild(this.search);

    this.displaySection = document.createElement("section");
    this.displaySection.className = "menu-display-list";
    this.root.appendChild(this.displaySection);
    this.startMenu();
  }


  startMenu() {
    this._state = "startPage";

    const locParts = location.pathname.split('/').slice(1,-1);

    const buildHref = (path) => {
      const newPath = []; let start = 0;
      if (path[0]==='/')
        path = path.slice(1);
      const pathParts = path.split('/');
      locParts.forEach((part, i)=>{
        if ((part !== pathParts[i]))
          newPath.push('..');
        else
          ++start;
      });
      newPath.push(this.rootFolder, ...pathParts.splice(start));
      return newPath.join('/');
    }

    const createLink = (page, li) => {
      const a = document.createElement("a");
      a.href = buildHref(page.path);
      a.appendChild(document.createTextNode(page.name));
      li.appendChild(a);
      return a;
    };

    const createLi = (ul, title) =>{
      const li = document.createElement("li");
      ul.appendChild(li);
      if (title) li.appendChild(document.createTextNode(title));
      li.addEventListener("click", (evt)=>{
        evt.stopPropagation();
        const ul = li.querySelector("*>ul");
        if (ul) {
          const method = ul.classList.contains("folded") ? "remove" : "add";
          ul.classList[method]("folded");
          if (method === "remove") {
            for(const n of evt.target.querySelectorAll("*>li.hidden"))
              n.classList.remove("hidden");
          }
        }
      });
      return li;
    }

    const createUl = (parent) =>{
      const ul = document.createElement("ul");
      if (!parent.classList.contains("menu-category-header"))
        ul.classList.add("folded");
      parent.appendChild(ul);
      return ul;
    }

    const createPageLinksForTag = (tag, ul) =>{
      // lookup page
      const pages = allPages.filter(p=>p.tags.indexOf(tag)>-1);
      for (const p of pages) {
        const li = createLi(ul);
        const a = createLink(p, li);
      }
    }

    this.displaySection.innerHTML = ""; // clear
    const categories = createUl(this.displaySection);
    categories.className = "menu-category-header";
    categories.appendChild(document.createTextNode("Kategorier"));
    const cb = (method)=>{ return (evt)=>{
        evt.stopPropagation();
        evt.target.classList[method]("currentHover");
    }}
    categories.addEventListener("mouseover", cb("add"));
    categories.addEventListener("mouseout", cb("remove"));

    const buildCatTree = (obj, ul) => {
      const arr = !Array.isArray(obj) ? Object.keys(obj) : obj;
      for(const o of arr) {
        if (o === 'tags' && obj[o].length) {
          for(const t of obj[o]) {
            const li = createLi(ul, tags[t]);
            const ul2 = createUl(li);
            createPageLinksForTag(t, ul2);
          }
        } else if (obj[o] !== undefined && typeof obj[o] === 'object') {
          const title = tags[o];
          const li = createLi(ul, title);
          const ul2 = createUl(li);
          buildCatTree(obj[o], ul2);
        }
      }
    }
    buildCatTree(tagSubCategories, categories);

    const aboutBtn = document.createElement("button");
    aboutBtn.textContent = "Om"
    aboutBtn.addEventListener("click", this.onAbout.bind(this));
    this.displaySection.appendChild(aboutBtn);
  }

  onAbout() {
    this._state = "aboutPage";
    this.displaySection.innerHTML = `
      <h3>Simulatorer & annat</h3>
      <p>Detta är en samling simulatorer och andra saker
      som är avsedda att användas i undervisning.</p>
      <p>De tillhandahålls
      som <strong>free/open source</strong> och skall ses som <i>free as in beer</i>,
      utan några garantier.</p>
      <p>Du får dock gärna hjälpa till med bugfixar, koda ny exempel etc på:
        <a href="https://github.com/mumme74/simulators">Simulators på github</a>
      </p>
      <section class='about-licence'>
      <h4>Copyright ${(new Date()).getFullYear()} Fredrik Johansson</h4>
      <p>
      Permission is hereby granted, free of charge, to any person obtaining a
      copy of this software and associated documentation files (the "Software"),
      to deal in the Software without restriction, including without limitation
      the rights to use, copy, modify, merge, publish, distribute, sublicense,
      and/or sell copies of the Software, and to permit persons to whom the Software
      is furnished to do so, subject to the following conditions:
      </p>
      <p>
      The above copyright notice and this permission notice shall be
      included in all copies or substantial portions of the Software.
      </p>
      <p>
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      </p>
      </section>
    `;
    const btn = document.createElement("button");
    btn.textContent = "Tillbaka";
    btn.addEventListener("click", this.startMenu.bind(this));
    this.displaySection.appendChild(btn);
  }

  onSearch(evt) {
    if (this._state !== "startPage")
      this.startMenu();

    const needle = this.search.value;
    if (!needle.length)
      return this.startMenu();

    const nodes = this.displaySection.querySelectorAll(
      ".menu-category-header a");
    for (const node of nodes) {
      let n = node, found = false;
      while(n !== this.displaySection && n) {
        if (!found) {
          const haystack = n.textContent.toLocaleLowerCase();
          found = haystack.indexOf(needle.toLocaleLowerCase()) > -1;
        }

        if (n.tagName === 'UL' && !n.classList.contains('menu-category-header'))
          n.classList[found ? "remove" : "add"]("folded");
        else if (n.tagName === 'LI')
          n.classList[found ? "remove" : "add"]("hidden");

        // go up tree to remove/search for needle
        n = n.parentElement;
      }
    }
  }
}

class MenuPopup extends Menu {
  _state = "startPage";
  constructor(toggleNode) {
    const root = document.createElement("div");
    super(root);

    this.toggleNode = toggleNode;
    document.body.appendChild(this.root);
    this.root.className = "menu-popup-root";
    toggleNode.addEventListener("click", this.toggleShow.bind(this));

    const closer = document.createElement("div");
    closer.appendChild(document.createTextNode("✖"));
    closer.className = "closer-cross";
    closer.addEventListener("click", this.hide.bind(this));
    this.root.firstElementChild.appendChild(closer);
  }

  hide() {
    const rect = this.root.getBoundingClientRect()
    this.root.style.left = `-${rect.width}px`;
  }

  show() {
    const rect = this.toggleNode.getBoundingClientRect();
    this.root.style.left = `${rect.left}px`;
    this.root.style.top = `${rect.top + rect.height}px`;
    this.search.focus();
  }

  isShown(){
    return this.root.getBoundingClientRect().left > 0;
  }

  toggleShow() {
    this.isShown() ? this.hide() : this.show();
  }
}

const hideShowMenu = document.createElement("span");
hideShowMenu.className = "toggle-menu-btn";
hideShowMenu.appendChild(document.createTextNode('☰'));
const header = document.querySelector("body > div:first-child > header");
header.insertBefore(hideShowMenu, header.firstElementChild);
const menu = new MenuPopup(hideShowMenu);
