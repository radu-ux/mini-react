# React From Scratch

## Contents

- React overview
- React Reconciler
- Reinventing the wheel
  - Fiber
  - Work Loop
  - Render/Reconciliation phase
  - Commit phase
  - Hooks

## React Overview

As you might already know and heard lots of time up until know, React is a javascript library focused on building UI blocks for your application. In other words, React is focused on producing a JSON description of the UI that a renderer (i.e ReactDOM), **with the use of the Reconciler**, knows how to interpret and transform it into an actual piece of UI. That's the main job of React. and that's the reason why we are able to use React to target other platforms than the web (i.e React Native). React provides the UI description and the renderer is responsible for translating that into platform specific elements. Let's take a simple example to better illustrate this:

```
function App() {
	return (
		<div>
			<h1>Hello World</h1>
		</div>
	)
}

ReactDOM.render(docuent.getElementById('root'), <App />)
```

The boring React component above, when executed it produces the following output (specifying only the relevant fields for this example)

```
{
	type: App,
	props: {
		children: [
			{
				type: 'div'
				props: {
					children: [
						{
							type: 'h1'
							props: {
								children: [
									{
										type: 'TEXT_ELEMENT',
										props: {
											nodeValue: 'Hello'
										}
									}
								]
							}
						}
					]
				}
			}
		]
	}
}
```

Now this JSON description is feed into the ReactDOM's _render_ function. There the reconciliation algorithm starts and the actual UI will be built.

So React by itself is a simple tool that helps developers describe their UI and together with a render and the reconciler, they enable us to build powerful and modern applications.

## React Reconciler

As mentioned in the previous section, the renderer uses the React Reconciler to build the UI from that JSON description (JSX tree). What do I mean by interpret? Well, here we come to the concept of Virtual DOM. I'm sure you've heard of it so far, but I want to give you my thoughts on how I see it.

Typically, every application has some state to keep track of. Even if a button switches from disabled to enabled might represent a pice of state in an application. So, React needs to store somehow the state of the current UI that is being rendered on the screen in order to produce a new UI derived from it. Here's the part where the concept of Virtual DOM kicks in. I like to think of it as a representation of the current UI that React keeps in memory. It does not store the actual DOM structure in memory, just a lightweight representation of it (we will come to it in the React Fiber section). When a state update happens, a new Virtual DOM is being computed and the Reconciler performs the diffing between the old and the new one in order to determine what needs to be changed in the actual UI.

That's mainly the job of the reconciler, computing the new Virtual DOM when a state update happens and determining what needs to be changed in the UI.

## Reinventing the wheel

What will come in the following subsection is a dummy implementation of React. A BIG disclaimer, the code that will follow is not a one-to-one mirroring of how React internally works and I think you wouldn't even expect that, right? :)), It's just some bad code that might give you some idea of how React does it's job. I have to give credits to the guys from didact. They have a cool repo from where I inspired. I took it a little bit further and tried to implement some more hooks than useState and also avoid hole app re-rendering on each state update.

Whit that being said, let's crack it!!!
