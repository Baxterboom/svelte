import { Readable } from 'svelte/store';
import { get_current_component } from './lifecycle';

export function noop() {}

export const identity = x => x;

export function assign<T, S>(tar: T, src: S): T & S {
	// @ts-ignore
	for (const k in src) tar[k] = src[k];
	return tar as T & S;
}

export function is_promise<T = any>(value: any): value is PromiseLike<T> {
	return value && typeof value === 'object' && typeof value.then === 'function';
}

export function add_location(element, file, line, column, char) {
	element.__svelte_meta = {
		loc: { file, line, column, char }
	};
}

export function run(fn) {
	return fn();
}

export function blank_object() {
	return Object.create(null);
}

export function run_all(fns) {
	fns.forEach(run);
}

// export function error_capture(){
// 	const onerror = window.onerror || noop;
// 	window.onerror = function(e) {
// 		error_handle(e);
// 		onerror(e);
// 	};
// }

export function error_handler(fn) {
	try { 
		return fn(); 
	} 
	catch(e) {
		error_handle(e); 
	}
}

export function error_handle(e) {
	const listners = get_current_component().$$.on_error;
	for(let item in listners) if(listners[item](e) === true) return;
	console.error(e);
}

export function is_function(thing: any): thing is Function {
	return typeof thing === 'function';
}

export function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

export function not_equal(a, b) {
	return a != a ? b == b : a !== b;
}

export function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

export function validate_store(store, name) {
	if (store != null && typeof store.subscribe !== 'function') {
		throw new Error(`'${name}' is not a store with a 'subscribe' method`);
	}
}

export function subscribe(store, ...callbacks) {
	if (store == null) {
		return noop;
	}
	const unsub = store.subscribe(...callbacks);
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}

export function get_store_value<T>(store: Readable<T>): T {
	let value;
	subscribe(store, _ => value = _)();
	return value;
}

export function component_subscribe(component, store, callback) {
	component.$$.on_destroy.push(subscribe(store, callback));
}

export function create_slot(definition, ctx, $$scope, fn) {
	if (definition) {
		const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
		return definition[0](slot_ctx);
	}
}

export function get_slot_context(definition, ctx, $$scope, fn) {
	return definition[1] && fn
		? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
		: $$scope.ctx;
}

export function get_slot_changes(definition, $$scope, dirty, fn) {
	if (definition[2] && fn) {
		const lets = definition[2](fn(dirty));

		if ($$scope.dirty === undefined) {
			return lets;
		}

		if (typeof lets === 'object') {
			const merged = [];
			const len = Math.max($$scope.dirty.length, lets.length);
			for (let i = 0; i < len; i += 1) {
				merged[i] = $$scope.dirty[i] | lets[i];
			}

			return merged;
		}

		return $$scope.dirty | lets;
	}

	return $$scope.dirty;
}

export function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
	const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
	if (slot_changes) {
		const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
		slot.p(slot_context, slot_changes);
	}
}

export function update_slot_spread(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_spread_changes_fn, get_slot_context_fn) {
	const slot_changes = get_slot_spread_changes_fn(dirty) | get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
	if (slot_changes) {
		const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
		slot.p(slot_context, slot_changes);
	}
}

export function exclude_internal_props(props) {
	const result = {};
	for (const k in props) if (k[0] !== '$') result[k] = props[k];
	return result;
}

export function compute_rest_props(props, keys) {
	const rest = {};
	keys = new Set(keys);
	for (const k in props) if (!keys.has(k) && k[0] !== '$') rest[k] = props[k];
	return rest;
}

export function compute_slots(slots) {
	const result = {};
	for (const key in slots) {
		result[key] = true;
	}
	return result;
}

export function once(fn) {
	let ran = false;
	return function(this: any, ...args) {
		if (ran) return;
		ran = true;
		fn.call(this, ...args);
	};
}

export function null_to_empty(value) {
	return value == null ? '' : value;
}

export function set_store_value(store, ret, value = ret) {
	store.set(value);
	return ret;
}

export const has_prop = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

export function action_destroyer(action_result) {
	return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}
