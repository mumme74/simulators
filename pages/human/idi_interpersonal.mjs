"use strict";

import { StateFromHash } from "../../lib/helpers/index.mjs";
import { Line, Polygon } from "../../lib/base.mjs";
import ModalSingleton, { Dialog } from  "../../lib/widgets/modal.mjs";
import { TabWgt } from "../../lib/widgets/tabwgt.mjs";

const hashStore = (new StateFromHash()).ref;

const asking = [
  ["Verkar självsäker", "Reserverad"],
  ["Passiv", "Aktiv"],
  ["Ger gensvar", "Kontrollerad"],
  ["Sorglös", "Allvarlig"],
  ["Tar ledningen", "Följer med"],
  ["Korrekt", "Otvungen"],
  ["Diciplinerad", "Spontan"],
  ["Kommunicerar gärna", "Tvekar att kommunicera"],
  ["Accepterar", "Ifrågasätter"],
  ["Verkar oorganiserad", "Verkar organiserad"],
  ["Inleder sociala kontakter", "Låter andra ta initiativet"],
  ["Ställer frågor", "Gör uttalande"],
  ["Högdragen", "Skygg/blyg"],
  ["Reserverad", "Skojfrisk"],
  ["Verkar aktiv", "Verkar tankfull"],
  ["Avslappnad", "Spänd"],
  ["Undanhåller känslor", "Uttrycker känslor"],
  ["Personinriktad", "Uppgiftsinriktad"],
  ["Framfusig", "Försiktig"],
  ["Väljer noga", "Impulsiv"],
  ["Utåtriktad", "Inåtvänd"],
  ["Varm", "Sval"],
  ["Finstämd", "Rakt på"],
  ["Håller distansen", "Sällskaplig"],
  ["Klargör genast åsikter", "Avvaktar"],
  ["Tyst", "Pratsam"],
  ["Framåt", "Ödmjuk"],
  ["Stabil", "Rastlös"],
  ["Mjuk", "Hård"],
  ["Försiktig", "Förhastad"],
  ["Känslosam", "Logisk"],
  ["Ensamvarg", "Social"],
  ["Vill ha äventyr", "Vill ha trygghet"],
  ["Systematisk", "Virrig"]
];
const sumQuestions = {
  A_sum: [0,4,7,10,12,14,18,20,24,26,32],
  B_sum: [1,3,8,11,15,22,25,27,29],
  C_sum: [5,6,13,16,19,23,31,33],
  D_sum: [2,9,17,21,28,30]
};
const baseTypes = {
  relator: {
    title:"Relator (stödjande)",
    text:`En person som upplevs som informell
          och hänger mer kallas för "stödjande" eller "samarbetaren".
          Effektiva människor med denna stil beskrivs ofta som mycket
          stödjande, lojala, pålitliga, engagerande, avspända, vänliga
          och omtänksamma - de är alltid på plats när de behövs.
          Människor med denna stil är bra på att skapa och bibehålla
          goda relationer med andra.`
  },
  processor: {
    title:"Processor (analyserande)",
    text:`En person som upplevs som formell och hänger med kallas
    för "analyserande" eller "logikern". Effektiva människor med denna
    stil beskrivs ofta som mycket eftertänksamma, objektiva,
    konsekventa, stadiga och logiska - inget tappas bort.
    Människor med denna stil är bra på att struktuera och analysera.`
  },
  producer: {
    title:"Producer (styrande)",
    text:`En person som upplevs som formell och dominant kallas för
    "styrande" eller "producerande". Effektiva människor med denna stil
    beskrivs ofta som mycket resultatinriktande, starka, självsäkra,
    praktiska, organiserande och beslutsamma - de går rakt på problemet.
    Människor med denna stil är bra på att driva framåt mot bestämda mål.`
  },
  motivator: {
    title:"Motivator (initiativrik)",
    text:`En person som upplevs som informell och dominant kallas för
    "initiativrik" eller "entusiasten". Effektiva människor med denna stil
    beskrivs ofta som mycket spännande, snabba, inspirerande, engagerande,
    entusiastiska, skapande och roliga - de hittar ofta på något nytt.
    Människor med denna stil är bra på att dra med andra personer på nya spår.`
  }
}

// ---------------------------------------------------------------

class Person {
  constructor(name, group) {
    this._evtListeners = [];
    this.name = name;
    this.group = group;
    this._remoteID = -1;
    this._remoteGrpID = -1;
    this.sums = {A:0, B:0, C:0, D:0};
    this.followOrDominant = 0;
    this.informalOrFormal = 0;
    this.questions = asking.map((q, nr)=>{
      return new Question(q[0], q[1], nr);
    });

    this._lastCheck = new Date(new Date().getTime -1000);

    const mayRecalc = (evt)=>{
      if (this._lastCheck.getTime() + 1000 > new Date().getTime()) {
        const msg = document.createElement('div');
        msg.innerHTML = `
        <h1 class="warn">För snabbt!</h1>
        <p>Du trycker för snabbt!</p>
        <p>Tänk efter riktigt innan du klickar!</p>`;
        ModalSingleton.setContent(msg);
        ModalSingleton.show();
        evt?.stopPropagation();
        evt?.preventDefault();
      }
      this._lastCheck = new Date();
      if (this.questions.reduce((v,q)=>v+=(q.dirty && q.choice>0) || 0,0) >= asking.length)
        this.recalculate();
    }

    document.querySelector("#questions").addEventListener("click", mayRecalc);
    mayRecalc();
  }

  recalculate() {
    for (const [ch] of Object.keys(this.sums)) {
      this.sums[ch] = sumQuestions[`${ch}_sum`].reduce((vlu, nr)=>{
        return vlu += this.questions[nr].choice;
      }, 0);
    }

    this.followOrDominant = (this.sums.A + 45  - this.sums.B) / 20;
    this.informalOrFormal = (this.sums.C + 30 - this.sums.D) / 14;
    this.personality = this.followOrDominant > 2.5 ?
      this.informalOrFormal > 2.5 ? baseTypes.relator : baseTypes.processor :
      this.informalOrFormal > 2.5 ? baseTypes.motivator : baseTypes.producer;

    for (const cb of this._evtListeners)
      cb(this);
  }

  addListener(cb) {
    this._evtListeners.push(cb);
  }
}

// ----------------------------------------------------------------

class NameGrpDlg extends Dialog {
  constructor() {
    super();
    //if (!hashStore.name) {
      const frm = this.frm = document.createElement("form");
      frm.addEventListener("submit", (e)=>{e.preventDefault()});
      const h1 = document.createElement("h1");
      h1.append("Namn och klass!");
      frm.append(h1);
      const makeRow = (name, placeholder)=> {
        const div = document.createElement("div");
        div.style.margin = "1rem";
        const lbl = document.createElement("label");
        lbl.style.width = "8rem";
        lbl.style.display = "inline-block";
        const input = document.createElement("input");
        lbl.name = name; lbl.append(placeholder);
        input.name = name; input.placeholder = placeholder;
        input.value = hashStore[name] || '';
        div.append(lbl, input);
        frm.append(div);
      }

      makeRow("name", "Namn");
      makeRow("group", "Klass/Grupp");
    //}
    if (hashStore.name) this.updateUser();
  }

  async exec(force=false) {
    if (!hashStore.name || force) {
      await this.showOkCancel(this.frm);
      hashStore.name = this.frm.querySelector("[name='name']").value;
      hashStore.group = this.frm.querySelector("[name='group']").value;
      this.updateUser();
    }
  }

  updateUser() {
    const yourdataTab = document.querySelector("#yourdataTab");
    yourdataTab.innerHTML = "";

    const h1 = document.createElement("h1");
    h1.append('Dina data:');
    yourdataTab.append(h1);

    const makeRow = (title, content) => {
      const row = document.createElement("div");
      const lbl = document.createElement('label');
      lbl.append(title);
      const data = document.createElement('span');
      data.append(content);
      row.append(lbl, data);
      yourdataTab.append(row);
    }
    makeRow('Namn:', hashStore.name);
    makeRow('Grupp:', hashStore.group);

    const btn = document.createElement("button");
    btn.append('Ändra');
    btn.addEventListener("click", async ()=>{
      await this.exec(true);
    });
    yourdataTab.append(btn);
  }
}

// ----------------------------------------------------------------

class Question {
  constructor(leftTxt, rightTxt, qnr) {
    this.choice = 0;
    this.leftTxt = leftTxt;
    this.rightTxt = rightTxt;
    this.saved = false;
    this.dirty = false;
    this.createNodes(qnr);
  }

  createNodes(qnr) {
    this.rootNode = document.createElement("div");
    this.rootNode.classList.add("question");
    this.leftTxtNode = document.createElement("div");
    this.leftTxtNode.classList.add("leftText");
    this.leftTxtNode.append(this.leftTxt);
    this.selectorNode = document.createElement("div");
    this.selectorNode.classList.add("selector");
    this.selectorNode.append(...[1,2,3,4].map(i=>{
      const n = document.createElement("div");
      n.setAttribute("data-vlu", i);
      n.append(""+i);
      n.addEventListener("click", (evt)=>{
        this.choose(i,evt,qnr);
      });
      if (hashStore[`q${qnr}`] === i) {
        n.classList.add("selected");
        this.dirty = true; this.choice = i;
      }
      return n;
    }));
    this.rightTxtNode = document.createElement("div");
    this.rightTxtNode.classList.add("rightText");
    this.rightTxtNode.append(this.rightTxt);

    this.rootNode.append(`${qnr+1}.`, this.leftTxtNode, this.selectorNode, this.rightTxtNode);
    document.querySelector("#questions").appendChild(this.rootNode);
  }

  choose(choice, evt, qnr) {
    if (evt) {
      const old = evt.target.parentNode.querySelector(".selected");
      if (old) old.classList.remove("selected");
      hashStore[`q${qnr}`] = choice;
    }
    this.dirty = this.choice !== choice;
    this.choice = choice;
    const node = this.selectorNode.querySelector(`*[data-vlu="${choice}"]`);
    if (node)
      node.classList.add("selected");
  }
}

// ------------------------------------------------------------------

class DisplayWgt {
  constructor(person) {
    const addTextEvt = (node, evtType, prop) => {
      node.addEventListener(evtType, ()=>{
        for (const n of document.querySelectorAll(`text.${prop}`))
          n.classList[evtType === 'mouseover' ? 'add' : 'remove']("show");
      });
    }
    for (const prop of ["relator", "processor", "producer", "motivator"]) {
      const arc = this[`${prop}Arc`] = document.querySelector(`path.${prop}`);
      addTextEvt(arc, "mouseover", prop);
      addTextEvt(arc, "mouseout", prop);
      arc.addEventListener("click", ()=>{
        this.showTypeDialog(baseTypes[prop]);
      });
    }

    this.horizBar = document.querySelector("#horizBar");
    this.vertBar = document.querySelector("#vertBar");
    this.resultMarker = document.querySelector("#resultMarker");

    this.areaPolygon = new Polygon({
      parentElement: this.relatorArc.parentElement,
      points: [{x:120,y:150},{x:150,y:180},
               {x:180,y:150},{x:150,y:120}],
      classList: ["resultArea"]
    });
    [this.xCross, this.yCross] = [
      [{x:0,y:150},{x:320,y:150}],
      [{x:150,y:0},{x:150,y:320}]
    ].map(pts=>
      new Line({
        parentElement: this.relatorArc.parentElement,
        point1: pts[0], point2: pts[1],
        classList:"crossLine"})
    );

    person.addListener(this.onChange.bind(this));
    this.onChange(person);
  }

  onChange(person) {
    document.querySelector("#showingPerson").innerText = `${person.name} i ${person.group}`;
    const formInf = person.informalOrFormal > 0 ? person.informalOrFormal : 2.5,
          followDom = person.followOrDominant > 0 ? 5-person.followOrDominant : 2.5;
    const vertPx = ((formInf -1) * 100),
          horizPx  = ((followDom -1) * 100);
    this.horizBar.style.transform = `translate(${horizPx - 150}px,0px)`;
    this.vertBar.style.transform = `translate(0px, ${vertPx - 150}px)`;
    this.resultMarker.style.transform = `translate(${horizPx}px, ${vertPx}px)`;

    this.xCross.point1.y = this.xCross.point2.y = vertPx;
    this.yCross.point1.x = this.yCross.point2.x = horizPx;

    this._explainResults(person);
    this._showResultArea(person);

    console.log(this.areaPolygon.points)
  }

  showTypeDialog(personality) {
    const info = document.createElement("div");
    const h1 = document.createElement("h1");
    h1.append(`${personality.title}`);
    const p = document.createElement("p");
    p.append(personality.text);
    info.append(h1, p);
    ModalSingleton.setContent(info);
    ModalSingleton.show();
  }

  _explainResults(person) {
    const tab = document.querySelector("#explanationTab");
    tab.innerHTML = '';
    const h1 = document.createElement('h1');
    h1.append("Förklaring resultat");
    tab.append(h1);

    if (Object.values(person.sums).find(s=>s!==0) === undefined) {
      const p = document.createElement('p');
      p.classList.add('warn');
      p.append('Ej tillräckligt med data ännu!');
      tab.append(p);
      return;
    }

    const makeSumRow = (sumName) => {
      const row = document.createElement('div');
      const title = document.createElement('span');
      title.append(`sum. ${sumName}`);
      title.style.fontWeight = 'bold';
      const p = document.createElement('span');
      const quest = sumQuestions[`${sumName}_sum`];
      const sum = person.sums[sumName]
      p.append(`frågor (${quest.map(nr=>nr+1).join()})=${sum}`);
      row.append(title, p);
      tab.append(row);
    }


    ['A','B','C','D'].forEach(ch=>makeSumRow(ch));

    tab.append(document.createElement('br'));

    const makeFormula = (formula, caption, value) => {
      const row = document.createElement('div');
      const title = document.createElement('div');
      title.append(caption);
      title.style.fontWeight = 'bold';
      const formul = document.createElement('span');
      formul.style.paddingLeft = '1rem'
      formul.append(formula);
      const res = document.createElement('span');
      res.append(` = ${value}`);
      row.append(title, formul, res);
      tab.append(row);
    }

    makeFormula('formel (C + 30 - D) / 14', 'Följare vs. Dominant', person.followOrDominant);
    tab.append(document.createElement('br'));
    makeFormula('formel (A + 45 - B) / 20', 'Formell vs. Informal', person.formalOrInformal);
    tab.append(document.createElement('br'));

    // your personality type
    const perRow = document.createElement("div");
    perRow.classList.add("personalityRow")
    const div1 = document.createElement("div");
    div1.append(`Du är en ${person.personality.title}`);
    const div2 = document.createElement('div');
    div2.append(person.personality.text);
    div2.addEventListener("click", ()=>{this.showTypeDialog(person.personality)})
    perRow.append(div1, div2);
    tab.append(perRow);
  }

  _showResultArea(person) {
    const aRes = person.sums.A / sumQuestions.A_sum.length -1,
          bRes = person.sums.B / sumQuestions.B_sum.length -1,
          cRes = person.sums.C / sumQuestions.C_sum.length -1,
          dRes = person.sums.D / sumQuestions.D_sum.length -1;
    this.areaPolygon.points[0].x = 150 - aRes * 50;
    this.areaPolygon.points[1].y = 150 + cRes * 50;
    this.areaPolygon.points[2].x = 150 + bRes * 50;
    this.areaPolygon.points[3].y = 150 - dRes * 50;
  }
}

// --------------------------------------------------------------

let person = null;
let displayWgt = null;
let tabs = null;
document.addEventListener("DOMContentLoaded", async ()=>{
  const dlg = new NameGrpDlg();
  await dlg.exec();
  person = new Person(hashStore.name, hashStore.group);
  displayWgt = new DisplayWgt(person);
  tabs = new TabWgt(document.querySelector("#result"));
});
