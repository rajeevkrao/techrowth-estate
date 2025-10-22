import "./button.scss"

export default function Button({ children, ...rest }) {
    return <button class="button" {...rest}>{children}</button>
}