'use client';
import { useSiteLocale } from '@/components/layout/locale-context';
import { Container } from '@/components/ui/primitives';
import styles from '@/app/states.module.css';
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}) { const {ui}=useSiteLocale(); return <Container><section className={styles.state} role="alert"><h1>{ui.errorTitle}</h1><p>{ui.errorBody}</p><button onClick={reset} className={styles.retry}>{ui.retry}</button></section></Container>; }
