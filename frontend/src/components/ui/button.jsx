import "./button.scss"
import { Link } from "react-router-dom";

export default function Container({ children, to, ...rest }) {
    if (to) {
        return <Link to={to}><Button {...rest}>{children}</Button></Link>
    } else {
        return <Button {...rest}>{children}</Button>
    }

}

function Button({ children, onHoverAnim, ...rest }) {
    return <button className={`button ${onHoverAnim ? "hover-anim" : ""}`} {...rest}> {children}</button>
}

