// ============================================================================
// 本棚登録フォーム（共通コンポーネント）
// ----------------------------------------------------------------------------
// /books/add（新規追加）と /books/[id]（編集）の両方から使う、
// ステータス・星評価・感想文・ジャンルを設定するフォーム部分を切り出したもの。
//
// 「追加」と「編集」で違う部分（初期値、送信先のServer Action、ボタンの文言）は
// propsとして外から渡してもらう形にすることで、このコンポーネント自体は
// 「追加か編集か」を知らなくてよいようにしている。
// ============================================================================

type Genre = {
    id: number;
    name: string;
};

type BookShelfFormProps = {
    bookTitle: string;
    allGenres: Genre[];
    // 編集時は既存の値、追加時は省略（undefinedならデフォルト値が使われる）
    initialStatus?: "want_to_read" | "reading" | "finished";
    initialRating?: number | null;
    initialReview?: string | null;
    initialGenreIds?: number[];
    // すでに .bind() 等で必要な引数を固定済みのServer Action。
    // 呼び出し側(add/page.tsx や [id]/page.tsx)が用意する。
    action: (formData: FormData) => void | Promise<void>;
    submitLabel: string;
};

export function BookShelfForm({
    bookTitle,
    allGenres,
    initialStatus = "want_to_read",
    initialRating,
    initialReview,
    initialGenreIds = [],
    action,
    submitLabel,
}: BookShelfFormProps) {
    return (
        // フォーム全体を.ice-cardに乗せて、他の画面のカードと同じ
        // すりガラスの見た目に揃えている
        <form action={action} className="ice-card gap-5">
            <p className="ice-card-title text-lg">{bookTitle}</p>

            <div className="ice-field">
                <label htmlFor="status" className="ice-field-label">ステータス</label>
                <select id="status" name="status" defaultValue={initialStatus} className="ice-select">
                    <option value="want_to_read">読みたい</option>
                    <option value="reading">読書中</option>
                    <option value="finished">読了</option>
                </select>
            </div>

            <div className="ice-field">
                <label htmlFor="rating" className="ice-field-label">評価</label>
                {/* ratingはnumber|null|undefinedなので、文字列に変換して
                    defaultValueに渡す（未評価の場合は空文字=""になる） */}
                <select id="rating" name="rating" defaultValue={initialRating?.toString() ?? ""} className="ice-select">
                    <option value="">評価なし</option>
                    <option value="1">★1</option>
                    <option value="2">★2</option>
                    <option value="3">★3</option>
                    <option value="4">★4</option>
                    <option value="5">★5</option>
                </select>
            </div>

            <div className="ice-field">
                <label htmlFor="review" className="ice-field-label">感想</label>
                <textarea
                    id="review"
                    name="review"
                    placeholder="感想を書く（任意）"
                    defaultValue={initialReview ?? ""}
                    className="ice-textarea"
                />
            </div>

            <div className="ice-field">
                <span className="ice-field-label">ジャンル</span>
                <div className="flex flex-wrap gap-2">
                    {allGenres.map((genre) => (
                        <label key={genre.id} className="ice-genre-chip">
                            <input
                                type="checkbox"
                                name="genreIds"
                                value={genre.id}
                                // 編集時、既に選ばれているジャンルにチェックを入れておく
                                defaultChecked={initialGenreIds.includes(genre.id)}
                            />
                            {genre.name}
                        </label>
                    ))}
                </div>
            </div>

            <button type="submit" className="ice-button self-start">{submitLabel}</button>
        </form>
    );
}
