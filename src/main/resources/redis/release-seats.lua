
-- KEYS: danh sách Redis key của các ghế
-- ARGV[1]: customerId

local customerId = ARGV[1]

-- Bước 1: Kiểm tra quyền sở hữu tất cả ghế
for i = 1, #KEYS do
    local currentOwner = redis.call('GET', KEYS[i])

    -- Ghế đang được khách hàng khác giữ
    if currentOwner and currentOwner ~= customerId then
        return 0
    end
end

-- Bước 2: Xóa các ghế do khách hàng hiện tại giữ
for i = 1, #KEYS do
    local currentOwner = redis.call('GET', KEYS[i])

    if currentOwner == customerId then
        redis.call('DEL', KEYS[i])
    end
end

return 1
