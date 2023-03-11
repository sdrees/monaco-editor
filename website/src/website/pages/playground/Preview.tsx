import * as React from "react";
import { IPreviewHandler, PlaygroundModel } from "./PlaygroundModel";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { IMessage, IPreviewState } from "../../../shared";

@observer
export class Preview
	extends React.Component<{ model: PlaygroundModel }>
	implements IPreviewHandler
{
	private disposables: monaco.IDisposable[] = [];
	@observable
	private counter = 0;
	private currentState: IPreviewState | undefined;
	private iframe: HTMLIFrameElement | null = null;

	render() {
		return (
			<div className="preview">
				<iframe
					className="full-iframe"
					key={this.counter}
					sandbox="allow-scripts allow-modals"
					frameBorder={0}
					ref={this.handleIframe}
					src="./playgroundRunner.html"
				/>
			</div>
		);
	}

	handleIframe = (iframe: HTMLIFrameElement | null) => {
		this.iframe = iframe;
		if (!iframe) {
			return;
		}
		iframe.addEventListener("load", () => {
			if (!this.currentState) {
				return;
			}

			const message: IMessage = {
				kind: "initialize",
				state: this.currentState,
			};
			iframe.contentWindow!.postMessage(message, {
				targetOrigin: "*",
			});
		});
	};

	componentDidMount() {
		this.disposables.push(this.props.model.setPreviewHandler(this));
	}

	componentWillUnmount() {
		this.disposables.forEach((d) => d.dispose());
	}

	handlePreview(state: IPreviewState): void {
		if (
			JSON.stringify({ ...state, css: "" }) ===
			JSON.stringify({ ...this.currentState, css: "" })
		) {
			// only css changed
			this.iframe?.contentWindow!.postMessage(
				{
					kind: "update-css",
					css: state.css,
				} as IMessage,
				{
					targetOrigin: "*",
				}
			);
			this.currentState = state;
		} else {
			this.currentState = state;
			this.counter++;
		}
	}
}
