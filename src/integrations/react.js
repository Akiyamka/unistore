import { createElement, Children, Component } from 'react';
import createReactClass from 'create-react-class';
import { assign, mapActions, select } from '../util';

const CONTEXT_TYPES = {
	store: () => {}
};

/** Wire a component up to the store. Passes state as props, re-renders on change.
 *  @param {Function|Array|String} mapStateToProps  A function mapping of store state to prop values, or an array/CSV of properties to map.
 *  @param {Function|Object} [actions] 				Action functions (pure state mappings), or a factory returning them. Every action function gets current state as the first parameter and any other params next
 *  @returns {Component} ConnectedComponent
 *  @example
 *    const Foo = connect('foo,bar')( ({ foo, bar }) => <div /> )
 *  @example
 *    const actions = { someAction }
 *    const Foo = connect('foo,bar', actions)( ({ foo, bar, someAction }) => <div /> )
 *  @example
 *    @connect( state => ({ foo: state.foo, bar: state.bar }) )
 *    export class Foo { render({ foo, bar }) { } }
 */
export function connect(mapStateToProps, actions) {
	if (typeof mapStateToProps!=='function') {
		mapStateToProps = select(mapStateToProps || []);
	}
	return Child => {
		const Wrapper = createReactClass({
			getInitialState() {
				this.store = this.context.store;
				this.state = mapStateToProps(this.store ? this.store.getState() : {}, this.props);
				this.boundActions = actions ? mapActions(actions, this.store) : { store: this.store };
			},
			update() {
				let mapped = mapStateToProps(this.store ? this.store.getState() : {}, this.props);
				for (let i in mapped) if (mapped[i] !== this.state[i]) {
					this.state = mapped;
					return this.forceUpdate();
				}
				for (let i in this.state) if (!(i in mapped)) {
					this.state = mapped;
					return this.forceUpdate();
				}
			},
			componentDidMount() {
				this.store.subscribe(this.update);
			},
			componentWillReceiveProps(p) {
				this.props = p;
				this.update();
			},
			componentWillUnmount() {
				this.store.unsubscribe(this.update);
			},
			render() {
				return createElement(Child, assign(assign(assign({}, this.boundActions), this.props), this.state));
			}
		});
		Wrapper.contextTypes = CONTEXT_TYPES;
		return Wrapper;
	};
}


/** Provider exposes a store (passed as `props.store`) into context.
 *
 *  Generally, an entire application is wrapped in a single `<Provider>` at the root.
 *  @class
 *  @extends Component
 *  @param {Object} props
 *  @param {Store} props.store		A {Store} instance to expose via context.
 */
export class Provider extends Component {
	getChildContext() {
		return { store: this.props.store };
	}
	render() {
		return Children.only(this.props.children);
	}
}
Provider.childContextTypes = CONTEXT_TYPES;
