const EXAMPLES = {
    1: { grammar: 'S -> aSb | ab', target: 'aaabbb' },
    2: { grammar: 'S -> AB\nA -> aA | a\nB -> bB | b', target: 'aabb' },
    3: { grammar: 'S -> aSa | bSb | a | b', target: 'ababa' },
    4: { grammar: 'E -> TA\nA -> +TA | ε\nT -> FB\nB -> *FB | ε\nF -> (E) | i', target: 'i+i*i' }
};

const elGrammar   = document.getElementById('grammar');
const elTarget    = document.getElementById('target');
const elGenerate  = document.getElementById('generate');
const elError     = document.getElementById('error');
const elOutput    = document.getElementById('output');
const elPlaceholder = document.getElementById('placeholder');
const elLeftmost  = document.getElementById('leftmost');
const elRightmost = document.getElementById('rightmost');
const elCanvas    = document.getElementById('parse-tree');
const elGrammarTable = document.querySelector('#grammar-table tbody');
const elLeftStepper  = document.getElementById('left-stepper');
const elRightStepper = document.getElementById('right-stepper');
const elStepPrev  = document.getElementById('step-prev');
const elStepNext  = document.getElementById('step-next');
const elStepAll   = document.getElementById('step-all');
const elStepInfo  = document.getElementById('step-info');
const elFullDerivs = document.getElementById('full-derivations');

let leftSteps = [], rightSteps = [], currentStep = 0, maxSteps = 0;

document.querySelectorAll('.btn-ex').forEach(btn => {
    btn.addEventListener('click', () => {
        const ex = EXAMPLES[btn.dataset.example];
        if (ex) { elGrammar.value = ex.grammar; elTarget.value = ex.target; }
    });
});

document.querySelectorAll('.btn-sym').forEach(btn => {
    btn.addEventListener('click', () => {
        const sym = btn.dataset.symbol;
        const s = elGrammar.selectionStart, e = elGrammar.selectionEnd;
        elGrammar.value = elGrammar.value.substring(0, s) + sym + elGrammar.value.substring(e);
        elGrammar.selectionStart = elGrammar.selectionEnd = s + sym.length;
        elGrammar.focus();
    });
});

elStepPrev.addEventListener('click', () => { if (currentStep > 0) { currentStep--; renderStep(); } });
elStepNext.addEventListener('click', () => { if (currentStep < maxSteps - 1) { currentStep++; renderStep(); } });
elStepAll.addEventListener('click', () => {
    elFullDerivs.classList.toggle('hidden');
    elStepAll.textContent = elFullDerivs.classList.contains('hidden') ? 'Show All' : 'Hide All';
});

elGenerate.addEventListener('click', generate);
elGrammar.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') generate(); });
elTarget.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') generate();
    if (e.key === 'Enter') generate();
});

document.addEventListener('keydown', e => {
    if (elOutput.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') { elStepPrev.click(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { elStepNext.click(); e.preventDefault(); }
});

function generate() {
    hideError();
    elOutput.classList.add('hidden');
    elPlaceholder.classList.remove('hidden');
    elFullDerivs.classList.add('hidden');
    elStepAll.textContent = 'Show All';

    try {
        const grammar = Grammar.parse(elGrammar.value);
        const target = elTarget.value.replace(/\s+/g, '');
        const root = Derivation.parse(grammar, target);

        if (!root) {
            showError(`The string "${target || 'ε'}" cannot be derived from this grammar.\nCheck the grammar rules and the input string.`);
            return;
        }

        renderGrammarTable(grammar);

        leftSteps  = Derivation.extractLeftmost(root);
        rightSteps = Derivation.extractRightmost(root);
        maxSteps = Math.max(leftSteps.length, rightSteps.length);
        currentStep = 0;
        renderStep();

        renderDerivation(leftSteps, elLeftmost);
        renderDerivation(rightSteps, elRightmost);

        new TreeRenderer(elCanvas).render(root);

        elPlaceholder.classList.add('hidden');
        elOutput.classList.remove('hidden');
    } catch (err) {
        showError(err.message);
    }
}

function renderGrammarTable(grammar) {
    elGrammarTable.innerHTML = '';
    for (const nt of Object.keys(grammar.rules)) {
        const tr = document.createElement('tr');

        const tdNT = document.createElement('td');
        tdNT.className = 'nt-cell';
        tdNT.textContent = nt;

        const tdProd = document.createElement('td');
        tdProd.className = 'prod-cell';
        tdProd.innerHTML = grammar.rules[nt].map(p => {
            if (p === '') return '<span class="eps">ε</span>';
            return formatForm(p);
        }).join('<span class="prod-sep">|</span>');

        tr.appendChild(tdNT);
        tr.appendChild(tdProd);
        elGrammarTable.appendChild(tr);
    }
}

function renderStep() {
    const ls = leftSteps[Math.min(currentStep, leftSteps.length - 1)];
    const rs = rightSteps[Math.min(currentStep, rightSteps.length - 1)];

    const lNext = currentStep + 1 < leftSteps.length ? leftSteps[currentStep + 1] : null;
    const rNext = currentStep + 1 < rightSteps.length ? rightSteps[currentStep + 1] : null;

    renderStepperPane(elLeftStepper, ls, lNext, 'leftmost');
    renderStepperPane(elRightStepper, rs, rNext, 'rightmost');

    elStepInfo.textContent = `Step ${currentStep + 1} / ${maxSteps}`;
    elStepPrev.disabled = (currentStep === 0);
    elStepNext.disabled = (currentStep >= maxSteps - 1);
}

function renderStepperPane(container, step, nextStep, mode) {
    let formHTML;

    if (nextStep && nextStep.production) {
        const ntToExpand = nextStep.production.split(' → ')[0];
        formHTML = formatFormWithHighlight(step.form, ntToExpand, mode);
    } else {
        formHTML = formatForm(step.form);
    }

    let html = `<div class="stepper-form">${formHTML}</div>`;
    if (step.production) {
        html += `<div class="stepper-prod">Applied: ${esc(step.production)}</div>`;
    } else {
        html += `<div class="stepper-prod">Start symbol</div>`;
    }
    container.innerHTML = html;
}

function formatFormWithHighlight(form, ntToExpand, mode) {
    if (form === 'ε') return '<span class="eps">ε</span>';

    let highlighted = false;
    const chars = form.split('');

    let highlightIdx = -1;
    if (mode === 'leftmost') {
        highlightIdx = chars.findIndex(ch => ch === ntToExpand);
    } else {
        for (let i = chars.length - 1; i >= 0; i--) {
            if (chars[i] === ntToExpand) { highlightIdx = i; break; }
        }
    }

    return chars.map((ch, i) => {
        if (i === highlightIdx && !highlighted) {
            highlighted = true;
            return `<span class="nt-active">${esc(ch)}</span>`;
        }
        if (/[A-Z]/.test(ch)) return `<span class="nt">${esc(ch)}</span>`;
        return `<span class="t">${esc(ch)}</span>`;
    }).join('');
}

function renderDerivation(steps, container) {
    container.innerHTML = '';

    const compact = document.createElement('div');
    compact.className = 'derivation-compact';
    compact.innerHTML = steps.map((s, i) => {
        const arrow = i > 0 ? '<span class="arrow"> ⇒ </span>' : '';
        return arrow + formatForm(s.form);
    }).join('');
    container.appendChild(compact);

    const detailed = document.createElement('div');
    detailed.className = 'derivation-steps';
    steps.forEach((step, i) => {
        const row = document.createElement('div');
        row.className = 'derivation-step';

        const num = document.createElement('span');
        num.className = 'step-num';
        num.textContent = `Step ${i + 1}`;

        const form = document.createElement('span');
        form.className = 'step-form';
        form.innerHTML = formatForm(step.form);

        row.appendChild(num);
        row.appendChild(form);

        if (step.production) {
            const prod = document.createElement('span');
            prod.className = 'step-prod';
            prod.textContent = `[${step.production}]`;
            row.appendChild(prod);
        }
        detailed.appendChild(row);
    });
    container.appendChild(detailed);
}

function formatForm(form) {
    if (form === 'ε') return '<span class="eps">ε</span>';
    return form.split('').map(ch => {
        if (/[A-Z]/.test(ch)) return `<span class="nt">${esc(ch)}</span>`;
        return `<span class="t">${esc(ch)}</span>`;
    }).join('');
}

function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showError(msg) { elError.textContent = msg; elError.classList.remove('hidden'); }
function hideError() { elError.classList.add('hidden'); }
