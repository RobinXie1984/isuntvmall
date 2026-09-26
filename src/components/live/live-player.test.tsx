import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
const locale=vi.hoisted(()=>({value:"en"}));
vi.mock("@/components/i18n/locale-provider",()=>({useLocale:()=>({locale:locale.value,t:(en:string,zh:string)=>locale.value==="en"?en:zh,localize:(text:string)=>text})}));
import {LivePlayer} from "./live-player";
import {getDemoLiveSessions} from "@/lib/data/demo";
describe("preview player labels",()=>{
 it.each(["facebook","instagram"])("%s external-link previews never claim a connected authorized broadcast",platform=>{locale.value="en";const room=getDemoLiveSessions().find(r=>r.platform===platform)!;const html=renderToStaticMarkup(<LivePlayer session={{...room,playbackMode:"external_link"}}/>);expect(html).toContain("DEMO ROOM");expect(html).toContain("No broadcast is connected");expect(html).not.toContain("authorized broadcast");expect(html).not.toContain("<a ");expect(html).not.toContain("<iframe");});
 it("keeps YouTube as an explicitly labelled player example even with a generic external-link mode",()=>{locale.value="en";const html=renderToStaticMarkup(<LivePlayer session={{...getDemoLiveSessions()[0],playbackMode:"external_link"}}/>);expect(html).toContain("not a live broadcast");expect(html).toContain('title="YouTube player example"');expect(html).toContain("youtube-nocookie.com/embed/M7lc1UVf-VE");expect(html).not.toContain("authorized broadcast");});
 it("invalid YouTube preview does not invite opening a supposed broadcast",()=>{locale.value="en";const html=renderToStaticMarkup(<LivePlayer session={{...getDemoLiveSessions()[0],embedId:null,externalUrl:"https://www.youtube.com/",playbackMode:"external_link"}}/>);expect(html).toContain("DEMO ROOM");expect(html).not.toContain("<a ");expect(html).not.toContain("<iframe");});
 it("retains actual published external playback",()=>{locale.value="en";const html=renderToStaticMarkup(<LivePlayer session={{...getDemoLiveSessions()[1],status:"live",playbackMode:"external_link"}}/>);expect(html).toContain("authorized broadcast");expect(html).toContain('href="https://www.facebook.com/"');expect(html).not.toContain("DEMO ROOM");});
 it("preview message follows the Chinese language selection",()=>{locale.value="zh-Hant";const html=renderToStaticMarkup(<LivePlayer session={{...getDemoLiveSessions()[2],titleZh:"旅行示範",playbackMode:"external_link"}}/>);expect(html).toContain("尚未接入正式直播");expect(html).toContain("旅行示範");expect(html).not.toContain("authorized broadcast");expect(html).not.toContain("No broadcast is connected");});
});
