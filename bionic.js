(function () {
    var STORAGE_KEY = "zapcz-bionic";
    var RATIO = 40;

    var WORD_RE = /[\p{L}\p{N}]+(?:['\u2019][\p{L}\p{N}]+)*/gu;
    var LETTER_RE = /\p{L}/u;
    var HAS_WORD_RE = /[\p{L}\p{N}]/u;

    var SKIP_TAGS = {
        SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, KBD: 1, SAMP: 1,
        VAR: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, IFRAME: 1,
        CANVAS: 1, SVG: 1, MATH: 1, BUTTON: 1, H1: 1, H2: 1, H3: 1,
        DT: 1, DD: 1, FIGCAPTION: 1,
        "BIONIC-W": 1, "BIONIC-F": 1, "BIONIC-T": 1
    };

    var SKIP_SELECTOR = ".eyebrow, .btn, .release-table, .release-stats, .notice strong, figcaption, [data-bionic-skip]";

    var root = document.querySelector("main");
    var button = document.getElementById("bionic-toggle");
    var label = document.getElementById("bionic-state");
    var on = false;

    if (!root || !button) return;

    function boldLength(word) {
        var n = word.length;
        if (n <= 1) return n;
        return Math.max(1, Math.min(n - 1, Math.round((n * RATIO) / 100)));
    }

    function eligible(node) {
        if (!node.nodeValue || !HAS_WORD_RE.test(node.nodeValue)) return false;
        var parent = node.parentElement;
        if (!parent) return false;
        if (SKIP_TAGS[parent.tagName]) return false;
        if (parent.isContentEditable) return false;
        if (parent.closest("bionic-w")) return false;
        if (parent.closest(SKIP_SELECTOR)) return false;
        return true;
    }

    function collect() {
        var found = [];
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                return eligible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        });
        var node;
        while ((node = walker.nextNode())) found.push(node);
        return found;
    }

    function transform(node) {
        if (!node.parentNode) return;
        var text = node.nodeValue;
        var wrap = document.createElement("bionic-w");
        var last = 0;
        var match;
        WORD_RE.lastIndex = 0;
        while ((match = WORD_RE.exec(text))) {
            var word = match[0];
            if (match.index > last) {
                wrap.appendChild(document.createTextNode(text.slice(last, match.index)));
            }
            last = match.index + word.length;
            if (!LETTER_RE.test(word)) {
                wrap.appendChild(document.createTextNode(word));
                continue;
            }
            var cut = boldLength(word);
            var head = document.createElement("bionic-f");
            head.textContent = word.slice(0, cut);
            wrap.appendChild(head);
            if (cut < word.length) {
                var tail = document.createElement("bionic-t");
                tail.textContent = word.slice(cut);
                wrap.appendChild(tail);
            }
        }
        if (last < text.length) wrap.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(wrap, node);
    }

    function apply() {
        var nodes = collect();
        for (var i = 0; i < nodes.length; i++) transform(nodes[i]);
    }

    function clear() {
        var wraps = root.querySelectorAll("bionic-w");
        var parents = [];
        for (var i = 0; i < wraps.length; i++) {
            var wrap = wraps[i];
            var parent = wrap.parentNode;
            if (!parent) continue;
            parent.replaceChild(document.createTextNode(wrap.textContent), wrap);
            if (parents.indexOf(parent) === -1) parents.push(parent);
        }
        for (var j = 0; j < parents.length; j++) parents[j].normalize();
    }

    function render() {
        button.setAttribute("aria-pressed", on ? "true" : "false");
        if (label) label.textContent = on ? "on" : "off";
    }

    function set(next) {
        if (next === on) return;
        on = next;
        if (on) apply();
        else clear();
        render();
    }

    button.addEventListener("click", function () {
        set(!on);
        try {
            localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
        } catch (err) {
            return;
        }
    });

    var stored = null;
    try {
        stored = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
        stored = null;
    }

    render();
    if (stored === "on") set(true);
})();
