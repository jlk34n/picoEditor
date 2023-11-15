class PicoFormContainer extends React.Component {
    render() {
        var rows = [];
        this.props.inputs.forEach(function(input) {
            rows.push(<PicoSearchInput labelFor = { input.label }
                        labelText = { input.label }
                        inputId = { input.id }
                        inputPlaceholder = { input.placeholder }
                        />)
        });

        return (
            <form>
                {rows}
            <PicoSearchSubmit />
            </form>
        );
    }
}

class PicoSearchInput extends React.Component {
    render() {
        // needs labelFor, labelText, inputId, inputPlaceholder
        return (
            <div className="picoField">
                <label for={this.props.labelFor}>{this.props.labelText}</label>
                <input id={this.props.inputId} placeholder={this.props.inputPlaceholder} type="text" />
                <span className="help">?</span>
            </div>
        );
    }
}

class PicoSearchSubmit extends React.Component {
    render() {
        return (
            <div>
                <input type="submit" />
                <input type="reset" />
            </div>
        )
    }
}

var INPUTS = [
    { id: 'picoPopulation', label: 'P', placeholder: 'Population', name: 'population' },
    { id: 'picoIntervention', label: 'I', placeholder: 'Intervention', name: 'intervention' },
    { id: 'picoCondition', label: 'C', placeholder: 'Condition', name: 'condition' },
    { id: 'picoOutcome', label: 'O', placeholder: 'Outcome', name: 'outcome' }
];

ReactDOM.render(
    <PicoFormContainer inputs={INPUTS} />,
    document.getElementById('picoBox')
)
