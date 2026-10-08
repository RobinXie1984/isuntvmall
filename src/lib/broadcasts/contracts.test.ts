import { describe, it, expect } from "vitest";
import { broadcastEmbed, broadcastPayloadSchema, validThumbnail } from "./contracts";
const payload = { kind:"broadcast",title:"Video",titleZh:"影片",titleHans:"视频",titleJa:"動画",url:"https://youtu.be/7CL0PxKA5iE",thumbnailUrl:"",position:0,visible:true,status:"recorded",productIds:[] };
describe("editorial broadcast input boundaries",()=>{
 it("normalizes actual YouTube links into official privacy enhanced embeds",()=>{
  for(const url of [payload.url,"https://www.youtube.com/watch?v=7CL0PxKA5iE","https://www.youtube.com/live/7CL0PxKA5iE"]) expect(broadcastEmbed(url).src).toBe("https://www.youtube-nocookie.com/embed/7CL0PxKA5iE?rel=0");
 });
 it("accepts supplied share video links but leaves posts and unspecified shares link-only",()=>{
  expect(broadcastEmbed("https://www.facebook.com/share/v/1HmZq19pUq/?mibextid=wwXIfr").src).toContain("https://www.facebook.com/plugins/video.php?");
  for(const path of ["share/p/1bFAWQmsx8/","share/1F68N2tf7u/"]) expect(broadcastEmbed(`https://www.facebook.com/${path}`).src).toBeNull();
 });
 it("rejects scripts, hostile domains, userinfo, ports and non-video YouTube URLs",()=>{
  for(const url of ["javascript:alert(1)","http://youtu.be/7CL0PxKA5iE","https://youtube.com.attacker.test/watch?v=7CL0PxKA5iE","https://user:pass@youtube.com/watch?v=7CL0PxKA5iE","https://youtube.com:8443/watch?v=7CL0PxKA5iE","https://youtube.com/watch?v=x"]) expect(broadcastPayloadSchema.safeParse({...payload,url}).success).toBe(false);
 });
 it("allows zero products and rejects duplicate IDs, incomplete translations and unexpected authority fields",()=>{
  expect(broadcastPayloadSchema.safeParse(payload).success).toBe(true);
  const id="90000000-0000-4000-8000-000000000001";
  for(const patch of [{productIds:[id,id]},{titleJa:""},{visible:"true"},{position:-1},{actorId:id}]) expect(broadcastPayloadSchema.safeParse({...payload,...patch}).success).toBe(false);
 });
 it("thumbnails cannot inject scripts, SVG or private destinations",()=>{
  for(const value of ["javascript:alert(1)","//attacker.test/a.png","https://localhost/a.jpg","https://127.0.0.1/a.jpg","https://example.com/a.svg","/products/../a.jpg"]) expect(validThumbnail(value)).toBe(false);
  for(const value of ["","/products/a.webp","https://i.ytimg.com/vi/7CL0PxKA5iE/hqdefault.jpg"]) expect(validThumbnail(value)).toBe(true);
 });
});
