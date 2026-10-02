// ============================================================================
// shadcn CLI が自動生成したコンポーネント（`npx shadcn@latest add button`）
// ----------------------------------------------------------------------------
// 自分でゼロから書いたファイルではなく、CLIがプロジェクトにコピーしてきたもの。
// ただし「自分のコード」としてプロジェクト内にあるので、中身を自由に編集できる
// （これがshadcn/uiの特徴。普通のnpmライブラリのようにnode_modulesの奥に
// 隠れているわけではない）。
// ============================================================================

// ButtonPrimitive: Base UI（アクセシビリティを担保するライブラリ）が提供する、
// 装飾なしの「素のボタンの振る舞い」。キーボード操作やaria属性の面倒を見てくれる。
// 見た目(className)は一切持っていないので、下で自分たちのスタイルを被せる。
import { Button as ButtonPrimitive } from "@base-ui/react/button"

// cva (class-variance-authority): 「variant（バリエーション）名」と
// 「実際のTailwindクラス文字列」の対応表を作るための関数。
// VariantProps: cvaの定義から、対応するTypeScriptの型を自動で作ってくれるヘルパー。
// （「variantに渡せる値は何か」を手で型定義しなくて済む）
import { cva, type VariantProps } from "class-variance-authority"

// cn: 複数のクラス名をまとめて1つの文字列にする関数。
// 単純な文字列結合ではなく、Tailwindのクラス同士が競合した場合に
// 「後から渡された方を優先する」処理もしてくれる（tailwind-merge相当の機能）。
import { cn } from "cn"

// buttonVariants: 「variant」と「size」という2つの軸で、ボタンの見た目を
// 切り替えられるようにする設定。cva(基本クラス, { variants: {...} }) という形で、
// 「組み合わせ」→「クラス文字列」の変換ルールを定義している。
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    // variant/sizeを何も指定しなかった時に使われる初期値
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Button: 実際に <Button>...</Button> として使うコンポーネント本体。
//
// Props の型 `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>` は、
//   - ButtonPrimitive.Props … 普通のボタンが持つprops（onClick, disabled, type等）
//   - VariantProps<typeof buttonVariants> … cvaで定義した variant/size のprops
// の「両方」を合体させた型（&は「AかつB」を意味する交差型）。
// なので <Button onClick={...} variant="outline" size="lg"> のように、
// 普通のボタンの属性とvariant/sizeの両方を指定できるようになっている。
function Button({
  className,
  variant = "default", // 指定がなければ"default"（通常の塗りつぶしボタン）
  size = "default",
  ...props // onClickやdisabledなど、他に渡された普通のボタンのpropsをまとめて受け取る
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      // buttonVariants({variant, size, className}) で「このvariant/sizeの組み合わせ
      // に対応するTailwindクラス文字列」を取得し、cn()で自分で渡したclassNameと
      // マージしている（例: <Button className="mt-4"> のように追加指定した分も合成される）
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
