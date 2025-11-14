import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL_NAME = "gemini-2.0-flash";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Generate commit messages via Gemini, forcing JSON output.
 * Returns array: [{ tone, message }, ...]
 */
export async function generateCommitMessages(diff, filesList) {
const prompt = `
  You MUST return ONLY valid JSON. 
No explanations, no extra text, no markdown, no commentary.
If you output anything that is not JSON, the system will break.
Return EXACTLY and ONLY the JSON array specified.

You are an expert software engineer writing a single, precise, conventional git commit message 
that summarizes all the following code changes.

Generate three stylistic variations of the same commit message:
1. Concise — short and minimal, ideal for quick commits.
2. Descriptive — adds brief context (what and why).
3. Formal — polished and professional, suitable for changelogs.

---

### ✅ STYLE GUIDELINES

1. Follow Conventional Commit Format:
   \<type>(<scope>): <description>\

   Allowed types:
   - feat, fix, refactor, docs, style, test, perf, build, ci, chore, revert

2. Scope = file/module name or general area (auth, api, config, ui, etc.)
3. Keep it specific and meaningful — describe intent and effect.
4. Avoid filler words like “updated code”, “minor changes”, “fixed stuff”.
5. Each tone should follow this structure:
   - Concise: ≤ 70 characters
   - Descriptive: ≤ 100 characters
   - Formal: ≤ 120 characters
6. Return ONLY a JSON array:
   [
     {"tone": "concise", "message": "..."},
     {"tone": "descriptive", "message": "..."},
     {"tone": "formal", "message": "..."}
   ]

---

### 🧠 EXAMPLES (70+)

# Feature commits (feat)
- feat(auth): add JWT authentication middleware
- feat(api): introduce user profile endpoints
- feat(ui): implement dark mode toggle
- feat(config): load environment variables using dotenv
- feat(dashboard): add charts for analytics overview
- feat(payment): integrate Stripe for transactions
- feat(router): support nested dynamic routes
- feat(editor): enable markdown preview feature
- feat(cli): add --init flag for quick project setup
- feat(upload): support multiple file uploads
- feat(settings): add user timezone preference
- feat(notifications): implement email alert system
- feat(mobile): add responsive layout for smaller screens
- feat(theme): implement theme switcher using local storage
- feat(search): add fuzzy search for user list
- feat(chat): add typing indicator feature

# Fix commits (fix)
- fix(api): handle null user response gracefully
- fix(auth): resolve invalid token error
- fix(ui): correct button alignment on mobile
- fix(router): prevent 404 on refresh for nested routes
- fix(config): correct .env variable parsing
- fix(db): close Mongo connection on process exit
- fix(payment): handle failed transaction retries
- fix(session): prevent session timeout during activity
- fix(css): fix overlapping modals on smaller screens
- fix(logging): avoid duplicate console outputs
- fix(build): fix path issue for bundled assets
- fix(form): validate empty email fields correctly
- fix(upload): resolve memory leak in image upload handler
- fix(theme): retain selected theme after reload
- fix(deploy): correct environment path in CI script

# Refactor commits (refactor)
- refactor(auth): simplify JWT token generation
- refactor(ui): modularize navbar and sidebar components
- refactor(api): replace callbacks with async/await
- refactor(config): extract shared constants
- refactor(db): optimize query performance
- refactor(cli): streamline command registration logic
- refactor(utils): remove duplicate helper functions
- refactor(core): split monolithic function into smaller ones
- refactor(server): improve error handling and structure
- refactor(store): clean up Redux action creators
- refactor(router): simplify route declaration format
- refactor(cache): use Map for better performance
- refactor(hooks): migrate from class to functional components
- refactor(http): wrap axios with unified error layer
- refactor(build): reorganize webpack config for clarity

# Docs commits (docs)
- docs(readme): add setup instructions
- docs(api): document /auth/login endpoint
- docs(contributing): clarify PR process
- docs(changelog): update release notes for v1.2
- docs(env): explain environment variable usage
- docs(architecture): describe module structure
- docs(tutorial): add getting-started section
- docs(readme): fix broken badge URLs
- docs(api): update response schema documentation
- docs(readme): include new feature examples
- docs(security): add password handling policy
- docs(readme): add commitai usage guide
- docs(cli): document --dry-run flag
- docs(readme): add command examples for Windows/Linux

# Style commits (style)
- style(ui): fix spacing and padding in card layout
- style(css): unify font sizes across components
- style(theme): adjust dark mode contrast
- style(readme): format markdown headings
- style(navbar): fix logo alignment
- style(button): improve hover animation
- style(code): apply prettier formatting
- style(footer): adjust link colors
- style(layout): increase section spacing
- style(css): clean unused class selectors

# Test commits (test)
- test(auth): add token expiry test
- test(api): add integration test for GET /users
- test(ui): test dark mode toggle functionality
- test(utils): cover edge cases for formatter
- test(router): add unit test for protected route
- test(build): verify webpack build output
- test(cli): ensure command parser works correctly
- test(config): test dotenv loading failure
- test(login): add form validation test
- test(performance): benchmark DB query time

# Performance commits (perf)
- perf(db): add index for faster user lookup
- perf(api): cache frequent GET responses
- perf(ui): lazy load large image assets
- perf(router): debounce navigation handler
- perf(store): memoize computed values
- perf(auth): reduce token validation overhead
- perf(build): optimize chunk splitting
- perf(server): compress response payloads
- perf(search): implement result pagination
- perf(logging): batch write logs to disk

# Build commits (build)
- build(webpack): enable source maps in dev
- build(ci): update node version to 20
- build(package): bump dependencies
- build(lint): configure pre-commit hook
- build(vite): optimize build pipeline
- build(eslint): enforce code formatting rules
- build(babel): enable class properties plugin
- build(docker): add production Dockerfile
- build(jest): configure code coverage thresholds
- build(npm): prepare package for publishing

# CI commits (ci)
- ci(github): add test and lint workflow
- ci(circleci): split build and deploy jobs
- ci(jenkins): add static analysis stage
- ci(docker): enable image caching
- ci(actions): update checkout version
- ci(coverage): integrate codecov reporting
- ci(deploy): configure staging deploy pipeline
- ci(release): automate changelog generation

# Chore commits (chore)
- chore(deps): update @google/generative-ai package
- chore(repo): clean up unused files
- chore(config): rename environment variables
- chore(scripts): add postinstall setup
- chore(lint): fix lint errors
- chore(format): run prettier across all files
- chore(env): add sample .env.example
- chore(logger): simplify log output
- chore(dev): add nodemon for local development
- chore(cleanup): remove deprecated code paths

# Revert commits (revert)
- revert(auth): rollback token validation change
- revert(api): revert broken endpoint update
- revert(ui): undo dark mode layout regression
- revert(config): revert dotenv import
- revert(router): undo async navigation refactor
- revert(server): revert error middleware refactor

---

### CHANGED FILES
${filesList}

### GIT DIFF
${diff.slice(0, 4000)}

Now — analyze these changes and return three stylistic variants of ONE smart, summary commit message 
that best describes what the developer did overall.

### Output Format
[
  {"tone": "concise", "message": "..."},
  {"tone": "descriptive", "message": "..."},
  {"tone": "formal", "message": "..."}
]
  REMINDER: Output ONLY valid JSON. 
No backticks. No markdown. No text before or after the JSON.

`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 512
      }
    });

    // result.response.text() should be valid JSON (string)
    const jsonText = result.response.text();
    const parsed = JSON.parse(jsonText);

    // Basic validation
    if (!Array.isArray(parsed)) throw new Error("AI returned non-array JSON");

    // Normalize shape
    const normalized = parsed.map((item) => {
      const tone = item.tone || item.type || "concise";
      const message = item.message || item.msg || item.text || "";
      return { tone, message };
    });

    return normalized;
  } catch (err) {
    console.error("AI generation error:", err);
    // Fallback: return safe fallback messages (non-sensitive)
    return [
      { tone: "concise", message: "chore: fallback commit message" },
      { tone: "descriptive", message: "chore: manual commit message (fallback)" },
      { tone: "formal", message: "chore: fallback commit message due to AI error" }
    ];
  }
}
