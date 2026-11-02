FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY
ENV CODEAI_STATIC_OUTPUT_DIR=dist
RUN npm run build
RUN set -eu;   candidates="${CODEAI_STATIC_OUTPUT_DIR:-} dist build out";   found="";   for dir in $candidates; do     [ -n "$dir" ] || continue;     if [ -f "$dir/index.html" ]; then found="$dir"; break; fi;   done;   if [ -z "$found" ] && [ -d .next ]; then     nested="$(find .next -path '*/server/app/index.html' -o -path '*/server/pages/index.html' | head -n 1)";     if [ -n "$nested" ]; then echo "Next.js build output was found in .next, but it is not a static export with index.html. Configure static export (for example output: 'export') or deploy it as a Node app." >&2; exit 1; fi;   fi;   if [ -z "$found" ]; then     nested="$(find . -name index.html -not -path './node_modules/*' -not -path './.git/*' -not -path '*/src/*' -not -path './public/*' | head -n 1)";     if [ -n "$nested" ]; then found="$(dirname "$nested")"; fi;   fi;   if [ -z "$found" ]; then echo "Build completed but no static site index.html was found. Expected one of: dist/index.html, build/index.html, out/index.html, or set CODEAI_STATIC_OUTPUT_DIR to the built app artifact directory." >&2; exit 1; fi;   rm -rf /tmp/codeai-static; mkdir -p /tmp/codeai-static;   cp -a "$found"/. /tmp/codeai-static/;   test -f /tmp/codeai-static/index.html || { echo "Detected static output '$found' but index.html was not copied." >&2; exit 1; };   echo "Using static build output: $found"
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /tmp/codeai-static/. /usr/share/nginx/html/
RUN test -f /usr/share/nginx/html/index.html || { echo "Static deployment packaging failed: /usr/share/nginx/html/index.html is missing." >&2; exit 1; }
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
EXPOSE 80
