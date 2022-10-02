"use strict";


const asking = [
  ["Verkar självsäker", "Reserverad"],
  ["Passiv", "Aktiv"],
  ["Ger gensvar", "Kontrollerad"],
  ["Sorglös", "Allvarlig"],
  ["Tar ledningen", "Hänger med"],
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
  A_sum: [1,5,8,11,13,15,19,21,25,27,33],
  B_sum: [2,4,9,12,16,23,26,28,30],
  C_sum: [6,7,14,17,20,24,32,34],
  D_sum: [3,10,18,22,29,31]
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
    Människor med denna stil är bra på att dra andra på nya spår.`
  }
}

// ---------------------------------------------------------------

class Person {
  constructor(name, grpName) {
    this.name = name;
    this.grpName = grpName;
    this._remoteID = -1;
    this._remoteGrpID = -1;
    this.sums = {A:0, B:0, C:0, D:0};
    this.followOrDominant = 0;
    this.formalOrInformal = 0;
    this.questions = asking.map((q, i)=>{
      return new Question(q[0], q[1]);
    });
  }

  recalculate() {
    for (const [ch] of Object.keys(this.sums)) {
      this.sums[ch] = sumQuestions[`${ch}_sum`].reduce((vlu, nr)=>{
        vlu += this.questions[nr].choice;
      }, 0);
    }

    this.followOrDominant = (this.sums.A + 45  - this.sums.B) / 20;
    this.formalOrInformal = (this.sums.C + 30 - this.sums.D) / 14;
  }
}

// ----------------------------------------------------------------


class Question {
  constructor(leftTxt, rightTxt) {
    this.choice = 0;
    this.leftTxt = leftTxt;
    this.rightTxt = rightTxt;
    this.saved = false;
    this.createNodes();
  }

  createNodes() {
    this.rootNode = document.createElement("div");
    this.rootNode.classList.add("question");
    this.leftTxtNode = document.createElement("div");
    this.leftTxtNode.classList.add("leftText");
    this.leftTxtNode.append(this.leftTxt)
    this.slider = document.createElement("input");
    this.slider.type = "range";
    this.slider.value = this.value;
    this.slider.min = 1;
    this.slider.max = 4;
    this.slider.step = 1;
    this.slider.classList.add("slider");
    this.slider.addEventListener("change", this.choose.bind(this));
    this.rightTxtNode = document.createElement("div");
    this.rightTxtNode.classList.add("div");
    this.rightTxtNode.append(this.rightTxt);

    this.rootNode.append(this.leftTxtNode, this.slider, this.rightTxtNode);
    document.querySelector("#questions").appendChild(this.rootNode);
  }

  choose(choice) {
    this.choice = choice || +this.slider.value;
  }
}

let person = null;
document.addEventListener("DOMContentLoaded", ()=>{
  person = new Person("test", "testGrp");
})
