# Loom video script — حوالي 5 دقايق

السكريبت بالعامية المصرية، مع المصطلحات التقنية بالإنجليزي. الكلام بين علامتي الاقتباس هو النص المقترح، والتعليمات المكتوبة تحت **على الشاشة** هي اللي تتعرض أثناء التسجيل.

## 0:00–0:25 — Introduction

**على الشاشة:** افتح الـ live application وخلي الكاميرا ظاهرة.

“Hi، أنا أحمد، وده حلّي للـ Stunning Full-Stack Task. سميت الـ product **BuildBrief**، وفكرته إنه يحوّل أي product idea بسيطة لـ clear technical build brief باستخدام AI، مع integrations context، optional authentication، وprivate persistence. حاولت أخلي الـ scope مركز، لكن في نفس الوقت أوضح إني بنيت end-to-end frontend وbackend flow.”

## 0:25–1:10 — Anonymous product flow

**على الشاشة:** ابدأ وأنت signed out، اختار مثال Shopify analytics، ثم Stripe وSlack، واضغط Generate.

“أول قرار product هنا إن الـ authentication اختياري. أي visitor يقدر يكتب فكرته ويعمل generation فورًا من غير friction.

هختار مثال Shopify analytics، ومعاه Stripe وSlack. الـ integrations هنا dummy context، مش connected accounts، وده مقصود حسب الـ task. الـ selected IDs بتتبعت للـ backend، والـ trusted catalog على السيرفر هو اللي بيحوّلها لـ system context؛ يعني الـ user ما يقدرش يحقن system instructions بنفسه.

لما أضغط Generate، الـ response بيظهر streaming بدل ما أستنى النتيجة كاملة. عندي كمان cancel، retry، regenerate، وcopy، والـ Markdown بيتعرض من غير raw HTML.”

**على الشاشة:** بعد اكتمال النتيجة، أشر إلى “Sign in to save future completed briefs”.

“بما إني anonymous، النتيجة دي مش بتتخزن. الـ UI بيوضح إن تسجيل الدخول هيحفظ الـ completed briefs الجاية، من غير ما يعطل الاستخدام الأساسي.”

## 1:10–2:05 — Google authentication and automatic save

**على الشاشة:** اضغط Sign in، ثم Continue with Google، وأكمل OAuth. ارجع للصفحة الرئيسية وأظهر البريد وHistory وSign out في الـ header.

“هسجل دلوقتي باستخدام Google OAuth. الـ flow مبني بـ Supabase Auth وPKCE، والـ callback بيعمل exchange للـ code مع validation للـ `next` path علشان يمنع open redirects.

بعد تسجيل الدخول، الـ server بيتأكد من الـ signed claims باستخدام `getClaims()`، والـ Next.js 16 `proxy.ts` مسؤول عن refresh للـ cookie session وتمرير الـ updated cookies والـ no-cache headers.”

**على الشاشة:** اعمل generation جديدة وأشر إلى Saving ثم Saved to history.

“دلوقتي هعمل generation جديدة. أول ما الـ stream يكتمل بنجاح، الـ authenticated user بيشوف `Saving…` وبعدها `Saved to history`.

كل model request بياخد client-generated UUID. لو حصل network failure، أقدر أعمل retry بنفس الـ request ID، والـ database unique constraint يمنع duplicate rows. ولو الـ save نفسه فشل، الـ generated output بيفضل ظاهر ومش بنضيّع شغل الـ user. الـ cancelled، failed، empty، أو anonymous generations ما بتتخزنش.”

## 2:05–2:45 — Protected History

**على الشاشة:** افتح History، وسّع brief، أظهر prompt/date/badges/output، ثم احذف brief تجريبي.

“صفحة History protected Server Component. لو مفيش authenticated session، بتحوّل المستخدم لـ login وترجعه لنفس الصفحة بعد النجاح.

هنا بعرض آخر عشرين brief: الـ original prompt، وقت الإنشاء، integration badges، والـ AI output بشكل expandable. الحذف معمول بـ Server Action، وبعده `revalidatePath` بيحدّث الصفحة. أنا معتمد على RLS في authorization، والـ cascade foreign key بيمسح relations الخاصة بالـ brief تلقائيًا.”

## 2:45–3:25 — Application architecture

**على الشاشة:** افتح `src/app/api/briefs/route.ts` ثم `src/components/buildbrief/builder.tsx`.

“الـ generation flow بيمر على `POST /api/generate`، وفيه Zod validation، server-only system prompt، request bounds، timeout، وstreaming من خلال AI SDK وGroq.

أما persistence فبتمر على `POST /api/briefs`. الـ route بيتأكد من الـ payload، وبعد كده يعمل verified claims check. لو الـ user anonymous بيرجع `401`، ولو الـ input غلط بيرجع `400`. بعد كده بينادي cookie-scoped Supabase client باستخدام publishable key فقط. مفيش service-role أو secret database key جوه الـ application.”

## 3:25–4:25 — Database relationships, atomic RPC, and RLS

**على الشاشة:** افتح Mermaid ERD في README أو Supabase Table Editor، وأظهر الجداول الثلاثة والعلاقات.

“بالنسبة للـ database design، عندي `auth.users` one-to-many مع `briefs`. وكل brief ليه many-to-many relation مع `integrations` عن طريق junction table اسمها `brief_integrations`.

أنا ما عملتش chat conversations أو messages، لأن الـ product single-turn generator. الـ accurate domain object هنا هو saved brief، وده بيخلي الـ schema أبسط وأوضح.

جدول `briefs` فيه owner `user_id`، الـ prompt، الـ output، `client_request_id` للـ idempotency، و`created_at`. جدول `integrations` read-only catalog، والـ junction table فيها composite primary key. كل العلاقات عليها foreign keys والـ required indexes.”

**على الشاشة:** افتح migration وأظهر `save_brief` ثم policy “Users can read their own briefs”.

“عملية الحفظ بتحصل من خلال `save_brief` Postgres function. هي `security invoker`، فمش بتتخطى RLS، وبتحفظ الـ brief والـ integration relations atomically في transaction واحدة. لو integration ID غير صالح، العملية كلها بتعمل rollback.

RLS enabled على الجداول الثلاثة، ومعاه explicit Data API grants. مثال الـ select policy على `briefs` هو: `(select auth.uid()) = user_id`. بالتالي User A يقدر يشوف ويمسح rows بتاعته فقط، ومش يقدر يوصل لبيانات User B. والـ anonymous role ما عندوش table privileges أصلًا. الـ integrations متاحة read-only للـ authenticated users، ومفيش client write policy عليها.”

## 4:25–4:50 — Verification and production judgment

**على الشاشة:** افتح tests ثم `DECISIONS.md`.

“الـ tests بتغطي invalid payloads، anonymous save، successful RPC، sanitized database errors، autosave، retry بنفس UUID، cancellation، save failure، unsafe OAuth redirects، protected History، وdelete revalidation. وعلى مستوى الـ database، المطلوب verify ownership isolation، cascade delete، rollback، وعدم تعديل integration catalog.

أكبر production risk لسه هو abuse للـ public inference endpoint. الـ authentication وRLS بيحموا saved data، لكن مش rate limiting. قبل public launch هضيف distributed rate limiter، usage budgets، moderation، وobservability.”

## 4:50–5:00 — Close

**على الشاشة:** ارجع للـ live application.

“فالنتيجة إن BuildBrief محافظ على anonymous AI demo سريع، وفي نفس الوقت بيعرض full-stack architecture حقيقية: Auth، server routes، Postgres relations، atomic persistence، وRLS authorization. شكرًا على وقتكم، ومستني الـ feedback.”
