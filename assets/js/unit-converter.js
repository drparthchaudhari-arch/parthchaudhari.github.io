(function () {
    'use strict';

    var CONVERSIONS = [
        { id: 'glucose', label: 'Glucose', from: 'mg/dL', to: 'mmol/L', formula: 'divide by 18', forward: function (v) { return v / 18; }, reverse: function (v) { return v * 18; } },
        { id: 'creatinine', label: 'Creatinine', from: 'mg/dL', to: 'umol/L', formula: 'multiply by 88.4', forward: function (v) { return v * 88.4; }, reverse: function (v) { return v / 88.4; } },
        { id: 'bun', label: 'BUN', from: 'mg/dL', to: 'mmol/L', formula: 'multiply by 0.357', forward: function (v) { return v * 0.357; }, reverse: function (v) { return v / 0.357; } },
        { id: 'calcium', label: 'Calcium', from: 'mg/dL', to: 'mmol/L', formula: 'multiply by 0.2495', forward: function (v) { return v * 0.2495; }, reverse: function (v) { return v / 0.2495; } },
        { id: 'phosphorus', label: 'Phosphorus', from: 'mg/dL', to: 'mmol/L', formula: 'multiply by 0.3229', forward: function (v) { return v * 0.3229; }, reverse: function (v) { return v / 0.3229; } },
        { id: 'bilirubin', label: 'Bilirubin', from: 'mg/dL', to: 'umol/L', formula: 'multiply by 17.1', forward: function (v) { return v * 17.1; }, reverse: function (v) { return v / 17.1; } },
        { id: 'cholesterol', label: 'Cholesterol', from: 'mg/dL', to: 'mmol/L', formula: 'multiply by 0.0259', forward: function (v) { return v * 0.0259; }, reverse: function (v) { return v / 0.0259; } },
        { id: 'hemoglobin', label: 'Hemoglobin', from: 'g/dL', to: 'g/L', formula: 'multiply by 10', forward: function (v) { return v * 10; }, reverse: function (v) { return v / 10; } },
        { id: 'wbc', label: 'WBC', from: 'K/uL', to: 'x10^9/L', formula: '1:1', forward: function (v) { return v; }, reverse: function (v) { return v; } },
        { id: 'rbc', label: 'RBC', from: 'M/uL', to: 'x10^12/L', formula: '1:1', forward: function (v) { return v; }, reverse: function (v) { return v; } },
        { id: 'platelets', label: 'Platelets', from: 'K/uL', to: 'x10^9/L', formula: '1:1', forward: function (v) { return v; }, reverse: function (v) { return v; } },
        { id: 'temperature', label: 'Temperature', from: 'C', to: 'F', formula: 'F = (C × 9/5) + 32', forward: function (v) { return (v * 9 / 5) + 32; }, reverse: function (v) { return (v - 32) * 5 / 9; } },
        { id: 'weight', label: 'Weight', from: 'kg', to: 'lb', formula: 'multiply by 2.20462', forward: function (v) { return v * 2.20462; }, reverse: function (v) { return v / 2.20462; } }
    ];

    var state = {
        reversed: false,
        map: {}
    };

    function toNumber(value) {
        var parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : NaN;
    }

    function getConversion() {
        var select = document.getElementById('converter-type');
        if (!select) {
            return null;
        }
        return state.map[String(select.value || '')] || null;
    }

    function formatValue(value) {
        if (!Number.isFinite(value)) {
            return '-';
        }
        if (Math.abs(value) >= 1000) {
            return value.toFixed(2);
        }
        return value.toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    function setText(id, value) {
        var node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    }

    function getDirection(conversion) {
        if (!conversion) {
            return { from: '-', to: '-' };
        }

        return state.reversed
            ? { from: conversion.to, to: conversion.from }
            : { from: conversion.from, to: conversion.to };
    }

    function render() {
        var conversion = getConversion();
        var inputNode = document.getElementById('converter-input');
        if (!conversion || !inputNode) {
            return;
        }

        var direction = getDirection(conversion);
        var numeric = toNumber(inputNode.value);

        setText('converter-input-label', 'Input (' + direction.from + ')');
        setText('converter-direction', direction.from + ' -> ' + direction.to);
        setText('converter-formula', conversion.formula);

        if (!Number.isFinite(numeric)) {
            setText('converter-output', '-');
            setText('converter-note', 'Enter a numeric value to convert.');
            return;
        }

        var converted = state.reversed ? conversion.reverse(numeric) : conversion.forward(numeric);
        setText('converter-output', formatValue(converted) + ' ' + direction.to);
        setText('converter-note', conversion.label + ' conversion completed.');
    }

    function populateSelect() {
        var select = document.getElementById('converter-type');
        if (!select) {
            return;
        }

        select.innerHTML = '';

        for (var i = 0; i < CONVERSIONS.length; i += 1) {
            var conversion = CONVERSIONS[i];
            state.map[conversion.id] = conversion;

            var option = document.createElement('option');
            option.value = conversion.id;
            option.textContent = conversion.label + ' (' + conversion.from + ' <-> ' + conversion.to + ')';
            select.appendChild(option);
        }
    }

    function init() {
        var form = document.getElementById('converter-form');
        var input = document.getElementById('converter-input');
        var select = document.getElementById('converter-type');
        var swap = document.getElementById('converter-swap');
        var clear = document.getElementById('converter-clear');

        if (!form || !input || !select || !swap || !clear) {
            return;
        }

        populateSelect();

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            render();
        });

        input.addEventListener('input', render);
        select.addEventListener('change', render);

        swap.addEventListener('click', function () {
            state.reversed = !state.reversed;
            render();
        });

        clear.addEventListener('click', function () {
            input.value = '';
            setText('converter-output', '-');
            setText('converter-note', 'Choose a conversion and type a value.');
        });

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
