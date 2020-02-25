pub fn shuffle<T: Copy>(arr: &mut [T]) {
    let mut current_index = arr.len();

    while current_index != 0 {
        let random_index = (js_sys::Math::random() * current_index as f64).floor() as usize;
        current_index -= 1;

        let temp = arr[current_index];
        arr[current_index] = arr[random_index];
        arr[random_index] = temp;
    }
}